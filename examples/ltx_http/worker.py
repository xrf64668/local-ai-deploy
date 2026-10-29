#!/usr/bin/env python3
"""Loopback-only, single-worker HTTP adapter for the real ltx-2-mlx CLI.

Python standard library only. No CUDA/MLX imports in this HTTP process.
All state, logs and outputs stay inside --project-root.
"""
from __future__ import annotations

import argparse
import hmac
import json
import os
import queue
import secrets
import shutil
import signal
import sqlite3
import sys
import urllib.error
import urllib.request
import subprocess
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

MAX_BODY = 8192
ALLOWED_INPUTS = {"prompt", "width", "height", "frames", "frame_rate"}
STATES = {"queued", "running", "succeeded", "failed", "canceled"}


def validate_request(body):
    if not isinstance(body, dict):
        raise ValueError("请求体必须是 JSON 对象")
    if set(body) - ALLOWED_INPUTS:
        raise ValueError("存在不支持的字段：" + ", ".join(sorted(set(body) - ALLOWED_INPUTS)))
    prompt = body.get("prompt")
    if not isinstance(prompt, str) or not 1 <= len(prompt.strip()) <= 1500:
        raise ValueError("prompt 必须为 1–1500 字符的文本")
    params = {"prompt": prompt.strip()}
    for key, default in (("width", 512), ("height", 320), ("frames", 25), ("frame_rate", 24)):
        raw = body.get(key, default)
        if type(raw) is not int:
            raise ValueError(key + " 必须是整数")
        params[key] = raw
    if not all(256 <= params[key] <= 1024 and params[key] % 32 == 0 for key in ("width", "height")):
        raise ValueError("width/height 必须为 256–1024 的 32 倍数")
    if not (9 <= params["frames"] <= 97 and (params["frames"] - 1) % 8 == 0):
        raise ValueError("frames 必须在 9–97 且满足 8n+1，例如 9、17、25、41")
    if not 8 <= params["frame_rate"] <= 30:
        raise ValueError("frame_rate 必须在 8–30 之间")
    return params


def build_command(uv, model_dir, output_file, params):
    return [
        str(uv), "run", "--no-sync", "ltx-2-mlx", "generate",
        "--distilled", "--low-ram",
        "--model", str(model_dir),
        "--prompt", params["prompt"],
        "-H", str(params["height"]),
        "-W", str(params["width"]),
        "-f", str(params["frames"]),
        "--frame-rate", str(params["frame_rate"]),
        "-o", str(output_file),
    ]


class JobManager:
    def __init__(self, root: Path, token: str, timeout_seconds=3600, max_pending=8, uv=None, ffprobe=None):
        self.root = root.expanduser().resolve(strict=True)
        self.src = self.root / "src"
        self.model = self.root / "models" / "ltx25-q4"
        self.outputs = self.root / "outputs"
        self.logs = self.root / "logs"
        self.data = self.root / "jobs"
        self.uv = Path(uv).resolve() if uv else self.root / ".tools" / "bin" / "uv"
        self.ffprobe = ffprobe if ffprobe else shutil.which("ffprobe")
        self.token = token
        self.timeout_seconds = timeout_seconds
        self.max_pending = max_pending
        self.lock = threading.RLock()
        self.events = queue.Queue()
        self.process = None
        self.process_id = None
        self.stopping = threading.Event()
        if not self.src.is_dir():
            raise RuntimeError("缺少运行时代码目录：请先完成 LTX 教程第 05 步")
        if not self.model.is_dir():
            raise RuntimeError("缺少模型目录：请先完成 LTX 教程第 04 步")
        if not self.uv.is_file():
            raise RuntimeError("缺少项目专属 uv：请先完成 LTX 教程第 03 步")
        if not self.ffprobe:
            raise RuntimeError("未找到 ffprobe，请先安装 FFmpeg")
        for p in (self.outputs, self.logs, self.data, self.root / ".cache"):
            p.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(self.data / "video-jobs.sqlite3", check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        with self.lock:
            self.db.execute("""CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY, state TEXT NOT NULL, params TEXT NOT NULL,
                created_at REAL NOT NULL, started_at REAL, ended_at REAL,
                error TEXT, output_bytes INTEGER
            )""")
            # No automatic rerun after a crash or restart.
            self.db.execute("UPDATE jobs SET state='failed', error='worker_interrupted', ended_at=? WHERE state IN ('queued','running')", (time.time(),))
            self.db.commit()
        self.thread = threading.Thread(target=self._loop, name="ltx-video-worker", daemon=True)
        self.thread.start()

    def _get(self, job_id):
        row = self.db.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
        return dict(row) if row else None

    def public_job(self, job_id):
        with self.lock:
            row = self._get(job_id)
        if not row:
            return None
        info = {
            "job_id": row["id"], "status": row["state"],
            "created_at": row["created_at"], "started_at": row["started_at"],
            "ended_at": row["ended_at"], "error": row["error"],
        }
        if row["state"] == "succeeded":
            info["result_url"] = "/v1/video/jobs/" + job_id + "/result"
            info["size_bytes"] = row["output_bytes"]
        return info

    def submit(self, params):
        with self.lock:
            active = self.db.execute("SELECT COUNT(*) FROM jobs WHERE state IN ('queued','running')").fetchone()[0]
            if active >= self.max_pending:
                raise OverflowError("任务队列已满，请稍后重试")
            jid = uuid.uuid4().hex
            self.db.execute("INSERT INTO jobs (id,state,params,created_at) VALUES (?,?,?,?)",
                            (jid, "queued", json.dumps(params, ensure_ascii=False), time.time()))
            self.db.commit()
            self.events.put(jid)
        return self.public_job(jid)

    def _set(self, jid, state, **attrs):
        assert state in STATES
        with self.lock:
            columns = ["state=?"] + [key + "=?" for key in attrs]
            values = [state] + list(attrs.values()) + [jid]
            self.db.execute("UPDATE jobs SET " + ",".join(columns) + " WHERE id=?", values)
            self.db.commit()

    def cancel(self, jid):
        with self.lock:
            row = self._get(jid)
            if not row:
                return None
            if row["state"] == "queued":
                self._set(jid, "canceled", ended_at=time.time())
            elif row["state"] == "running":
                self._set(jid, "canceled", ended_at=time.time())
                if self.process_id == jid and self.process and self.process.poll() is None:
                    self._terminate(self.process)
        return self.public_job(jid)

    @staticmethod
    def _terminate(proc):
        if proc.poll() is not None:
            return
        try:
            os.killpg(proc.pid, signal.SIGTERM)
        except ProcessLookupError:
            return
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass

    def _environment(self):
        env = os.environ.copy()
        local = {
            "HF_HOME": ".cache/huggingface",
            "PIP_CACHE_DIR": ".cache/pip",
            "UV_CACHE_DIR": ".cache/uv",
            "UV_PYTHON_INSTALL_DIR": ".cache/uv/python",
            "XDG_CACHE_HOME": ".cache",
        }
        for key, value in local.items():
            path = self.root / value
            path.mkdir(parents=True, exist_ok=True)
            env[key] = str(path)
        env["UV_PYTHON_DOWNLOADS"] = "never"
        env["PYTHONUNBUFFERED"] = "1"
        env.pop("LTX_API_KEY", None)  # Do not pass HTTP API credentials to model subprocess.
        return env

    def _probe(self, output):
        result = subprocess.run(
            [str(self.ffprobe), "-v", "error", "-show_entries", "format=duration,size",
             "-of", "json", str(output)],
            capture_output=True, text=True, timeout=30, check=False,
        )
        if result.returncode != 0:
            return False
        try:
            info = json.loads(result.stdout)["format"]
            return float(info["duration"]) > 0 and int(info["size"]) > 0
        except (KeyError, ValueError, TypeError, json.JSONDecodeError):
            return False

    def _loop(self):
        while not self.stopping.is_set():
            try:
                jid = self.events.get(timeout=.2)
            except queue.Empty:
                continue
            with self.lock:
                row = self._get(jid)
                if not row or row["state"] != "queued":
                    continue
                self._set(jid, "running", started_at=time.time())
            params = json.loads(row["params"])
            out = self.outputs / (jid + ".mp4")
            command = build_command(self.uv, self.model, out, params)
            try:
                with (self.logs / (jid + ".log")).open("w", encoding="utf-8") as log:
                    # Never shell=True; all user content is a single argv element.
                    proc = subprocess.Popen(command, cwd=self.src, env=self._environment(),
                                            stdout=log, stderr=subprocess.STDOUT,
                                            start_new_session=True)
                    with self.lock:
                        self.process, self.process_id = proc, jid
                        if self._get(jid)["state"] == "canceled":
                            self._terminate(proc)
                    try:
                        rc = proc.wait(timeout=self.timeout_seconds)
                    except subprocess.TimeoutExpired:
                        self._terminate(proc)
                        self._set(jid, "failed", ended_at=time.time(), error="timeout")
                        continue
                with self.lock:
                    if self._get(jid)["state"] == "canceled":
                        continue
                if rc != 0:
                    self._set(jid, "failed", ended_at=time.time(), error="inference_process_failed")
                elif not out.is_file() or out.stat().st_size <= 0 or not self._probe(out):
                    self._set(jid, "failed", ended_at=time.time(), error="invalid_video_output")
                else:
                    self._set(jid, "succeeded", ended_at=time.time(), output_bytes=out.stat().st_size)
            except Exception:
                # Sensitive subprocess logs stay in project/logs; the API returns a safe code only.
                self._set(jid, "failed", ended_at=time.time(), error="worker_internal_error")
            finally:
                with self.lock:
                    if self.process_id == jid:
                        self.process, self.process_id = None, None

    def close(self):
        self.stopping.set()
        with self.lock:
            if self.process and self.process.poll() is None:
                self._terminate(self.process)
        self.thread.join(timeout=6)
        with self.lock:
            self.db.close()


def create_server(manager, port=18080):
    class Handler(BaseHTTPRequestHandler):
        server_version = "LTXLocalAPI/1.0"
        def log_message(self, fmt, *args):
            # No request headers or prompts are written to server console.
            return

        def respond(self, status, data):
            payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(payload)

        def auth(self):
            value = self.headers.get("X-API-Key", "")
            if not hmac.compare_digest(value.encode("utf-8"), manager.token.encode("utf-8")):
                self.respond(401, {"error": "unauthorized"})
                return False
            return True

        def route(self):
            return urlsplit(self.path).path.rstrip("/") or "/"

        def do_GET(self):
            path = self.route()
            if path == "/health":
                self.respond(200, {"status": "ok", "backend": "ltx-2-mlx", "worker": "single"})
                return
            if not self.auth():
                return
            parts = path.strip("/").split("/")
            if len(parts) >= 4 and parts[:3] == ["v1", "video", "jobs"] and len(parts[3]) == 32:
                jid = parts[3]
                if not all(c in "0123456789abcdef" for c in jid):
                    self.respond(404, {"error": "job_not_found"}); return
                job = manager.public_job(jid)
                if not job:
                    self.respond(404, {"error": "job_not_found"}); return
                if len(parts) == 4:
                    self.respond(200, job); return
                if len(parts) == 5 and parts[4] == "result":
                    if job["status"] != "succeeded":
                        self.respond(409, {"error": "result_not_ready"}); return
                    path_on_disk = manager.outputs / (jid + ".mp4")
                    if not path_on_disk.is_file():
                        self.respond(410, {"error": "result_missing"}); return
                    self.send_response(200)
                    self.send_header("Content-Type", "video/mp4")
                    self.send_header("Content-Length", str(path_on_disk.stat().st_size))
                    self.send_header("Content-Disposition", 'attachment; filename="' + jid + '.mp4"')
                    self.send_header("X-Content-Type-Options", "nosniff")
                    self.end_headers()
                    with path_on_disk.open("rb") as file:
                        shutil.copyfileobj(file, self.wfile, 1024 * 1024)
                    return
            self.respond(404, {"error": "not_found"})

        def do_POST(self):
            if not self.auth():
                return
            path = self.route()
            if path == "/v1/video/jobs":
                ctype = self.headers.get("Content-Type", "")
                if "application/json" not in ctype:
                    self.respond(415, {"error": "content_type_must_be_json"}); return
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                except ValueError:
                    self.respond(400, {"error": "invalid_content_length"}); return
                if not 0 < length <= MAX_BODY:
                    self.respond(413, {"error": "invalid_json_size"}); return
                try:
                    body = json.loads(self.rfile.read(length))
                    params = validate_request(body)
                    job = manager.submit(params)
                    self.respond(202, job)
                except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
                    self.respond(400, {"error": "invalid_request", "message": str(exc)})
                except OverflowError:
                    self.respond(429, {"error": "queue_full"})
                return
            parts = path.strip("/").split("/")
            if len(parts) == 5 and parts[:3] == ["v1", "video", "jobs"] and parts[-1] == "cancel":
                job = manager.cancel(parts[3]) if len(parts[3]) == 32 else None
                if not job:
                    self.respond(404, {"error": "job_not_found"})
                else:
                    self.respond(200, job)
                return
            self.respond(404, {"error": "not_found"})

    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


def main():
    parser = argparse.ArgumentParser(description="Local-only LTX video HTTP worker")
    parser.add_argument("--project-root", type=Path, required=True, help="The selected LTX project folder")
    parser.add_argument("--port", type=int, default=18080)
    parser.add_argument("--timeout", type=int, default=3600)
    args = parser.parse_args()
    key = os.environ.get("LTX_API_KEY", "")
    if len(key) < 24:
        parser.error("先在终端设置至少 24 字符的 LTX_API_KEY；不要把它写入源码")
    if not 1024 <= args.port <= 65535:
        parser.error("端口范围必须是 1024–65535")
    if not 30 <= args.timeout <= 21600:
        parser.error("单任务最长运行时间为 30–21600 秒")
    manager = JobManager(args.project_root, key, timeout_seconds=args.timeout)
    server = create_server(manager, args.port)
    print("LTX Local API: http://127.0.0.1:" + str(args.port), flush=True)
    print("只有 localhost 可以访问。Ctrl+C 停止；日志留在项目 logs/。", flush=True)
    try:
        server.serve_forever(poll_interval=.2)
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        manager.close()



# ---- Beginner commands: use the script's own directory as the project root. ----
def beginner_key(root: Path, create=False):
    """Read the project's private key; optionally create it once, never overwrite."""
    secret_dir = root / ".secrets"
    key_file = secret_dir / "ltx-api-key"
    if create:
        secret_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        secret_dir.chmod(0o700)
        try:
            fd = os.open(str(key_file), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        except FileExistsError:
            pass
        else:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                handle.write(secrets.token_urlsafe(36) + "\n")
    if not key_file.is_file() or key_file.is_symlink():
        raise RuntimeError("没有安全的本地 API Key；请先运行 python3 worker.py start")
    if key_file.stat().st_mode & 0o077:
        raise RuntimeError("API Key 文件权限过宽，请先运行 chmod 600 .secrets/ltx-api-key")
    value = key_file.read_text(encoding="utf-8").strip()
    if len(value) < 24:
        raise RuntimeError("API Key 长度不符合安全要求")
    return value


def beginner_generate(root: Path, prompt: str, base="http://127.0.0.1:18080",
                      poll_interval=2.0, timeout=7200):
    """Create job, poll, and retrieve a real MP4. Never reports success while queued."""
    if not isinstance(prompt, str) or not 1 <= len(prompt.strip()) <= 1500:
        raise ValueError("视频描述需要 1–1500 个字符")
    key = beginner_key(root)
    base = base.rstrip("/")

    def api(method, path, payload=None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
        headers = {"X-API-Key": key}
        if body is not None:
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(base + path, data=body, method=method, headers=headers)
        try:
            return urllib.request.urlopen(req, timeout=20)
        except urllib.error.HTTPError as exc:
            detail = exc.read(1500).decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError("无法连接本地视频服务；请在另一个终端先运行 python3 worker.py start") from exc

    with api("POST", "/v1/video/jobs", {"prompt": prompt.strip()}) as res:
        if res.status != 202:
            raise RuntimeError("服务器未接受新任务 (HTTP " + str(res.status) + ")")
        job = json.load(res)
    jid = job["job_id"]
    if not (isinstance(jid, str) and len(jid) == 32 and all(c in "0123456789abcdef" for c in jid)):
        raise RuntimeError("服务器返回的任务编号无效")
    print("已提交视频任务：" + jid, flush=True)
    state = None
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        with api("GET", "/v1/video/jobs/" + jid) as res:
            job = json.load(res)
        latest = job.get("status")
        if latest != state:
            messages = {"queued": "正在排队", "running": "正在生成视频",
                        "succeeded": "生成完成，正在保存视频",
                        "failed": "生成失败", "canceled": "任务已取消"}
            print(messages.get(latest, str(latest)), flush=True)
            state = latest
        if latest == "succeeded":
            break
        if latest in ("failed", "canceled"):
            raise RuntimeError("任务未完成：" + str(job.get("error") or latest)
                               + "\n请查看项目 logs/" + jid + ".log")
        time.sleep(poll_interval)
    else:
        raise RuntimeError("客户端等待超时；任务可能仍在执行。任务编号：" + jid)

    folder = root / "outputs"
    folder.mkdir(parents=True, exist_ok=True)
    outfile = folder / ("http-" + jid + ".mp4")
    partial = folder / ("http-" + jid + ".mp4.part")
    try:
        with api("GET", "/v1/video/jobs/" + jid + "/result") as response:
            if response.status != 200 or response.headers.get_content_type() != "video/mp4":
                raise RuntimeError("服务器未返回 MP4 视频")
            with partial.open("wb") as output:
                shutil.copyfileobj(response, output, 1024 * 1024)
        if partial.stat().st_size <= 0:
            raise RuntimeError("收到的 MP4 文件为空")
        partial.replace(outfile)
    finally:
        partial.unlink(missing_ok=True)
    print("视频已保存到：" + str(outfile), flush=True)
    print("如视频无法播放，请用 ffprobe 核对文件格式。", flush=True)
    return outfile


def beginner_main(argv):
    parser = argparse.ArgumentParser(
        description="LTX 新手入口：start 启动本地 HTTP 服务；generate 自动等待并下载视频")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("start", help="在当前项目内自动生成 API Key 并启动服务")
    gen = sub.add_parser("generate", help="提交视频生成任务，并在完成后自动下载 MP4")
    gen.add_argument("prompt", help="你希望生成的视频内容")
    args = parser.parse_args(argv)
    # The downloaded script always lives directly inside the user's project.
    root = Path(__file__).resolve().parent
    if args.command == "start":
        token = beginner_key(root, create=True)
        env = os.environ.copy()
        env["LTX_API_KEY"] = token
        # Reuse the original secure localhost server path without an extra shell.
        os.execve(sys.executable,
                  [sys.executable, str(Path(__file__).resolve()), "--project-root", str(root), "--port", "18080"],
                  env)
    if args.command == "generate":
        beginner_generate(root, args.prompt)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ("start", "generate"):
        beginner_main(sys.argv[1:])
    else:
        main()
