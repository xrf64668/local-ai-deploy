"""Offline contract tests: fake CLI and ffprobe, no model weights required."""
import json
import os
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from sys import path as python_path

python_path.insert(0, str(Path(__file__).resolve().parents[1]))
from worker import JobManager, build_command, create_server, validate_request


class ValidationTests(unittest.TestCase):
    def test_video_params_reject_shell_and_invalid_frame_values(self):
        self.assertEqual(validate_request({"prompt": "你好"})["frames"], 25)
        for data in (
            {"prompt": ""},
            {"prompt": "x", "frames": 24},
            {"prompt": "x", "width": 513},
            {"prompt": "x", "width": 2048},
            {"prompt": "x", "height": True},
            {"prompt": "x", "extra_arg": "--unsafe"},
        ):
            with self.assertRaises(ValueError):
                validate_request(data)

    def test_command_never_uses_shell_interpolation(self):
        params = validate_request({"prompt": "test; touch /tmp/should-not-exist"})
        cmd = build_command(Path("/private/tools/uv"), Path("/tmp/model"), Path("/tmp/out.mp4"), params)
        self.assertIsInstance(cmd, list)
        self.assertIn(params["prompt"], cmd)
        self.assertNotIn("sh", cmd[:3])
        self.assertIn("--no-sync", cmd)


class ServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / "src").mkdir()
        (self.root / "models" / "ltx25-q4").mkdir(parents=True)
        tools = self.root / ".tools" / "bin"
        tools.mkdir(parents=True)
        self.uv = tools / "uv"
        self.uv.write_text(
            "#!/usr/bin/env python3\n"
            "import pathlib,sys\n"
            "argv=sys.argv\n"
            "name=argv[argv.index('-o')+1]\n"
            "pathlib.Path(name).write_bytes(b'\\x00\\x00\\x00\\x10ftypfakefile')\n"
        )
        self.uv.chmod(0o755)
        self.ffprobe = self.root / "fake-ffprobe"
        self.ffprobe.write_text(
            "#!/usr/bin/env python3\n"
            "print('{\"format\":{\"duration\":\"1.0\",\"size\":\"16\"}}')\n"
        )
        self.ffprobe.chmod(0o755)
        self.token = "this-is-a-test-only-api-key-12345"
        self.manager = JobManager(self.root, self.token, timeout_seconds=15, uv=self.uv, ffprobe=str(self.ffprobe))
        self.server = create_server(self.manager, port=0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = "http://127.0.0.1:" + str(self.server.server_address[1])

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=4)
        self.manager.close()
        self.temp.cleanup()

    def call(self, method, path, payload=None, token=None):
        body = json.dumps(payload).encode() if payload is not None else None
        headers = {"X-API-Key": self.token if token is None else token}
        if body is not None:
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(self.base + path, data=body, method=method, headers=headers)
        try:
            response = urllib.request.urlopen(req, timeout=4)
        except urllib.error.HTTPError as err:
            return err.code, json.loads(err.read())
        ctype = response.headers.get("Content-Type")
        raw = response.read()
        if ctype == "video/mp4":
            return response.status, raw
        return response.status, json.loads(raw)

    def test_lifecycle_real_http_with_fake_cli(self):
        code, health = self.call("GET", "/health", token="anything")
        self.assertEqual(code, 200)
        self.assertEqual(health["backend"], "ltx-2-mlx")
        code, error = self.call("POST", "/v1/video/jobs", {"prompt": "hello"}, token="bad")
        self.assertEqual(code, 401)
        code, job = self.call("POST", "/v1/video/jobs", {"prompt": "纸船漂浮在湖上"})
        self.assertEqual(code, 202)
        jid = job["job_id"]
        self.assertRegex(jid, r"^[0-9a-f]{32}$")
        for _ in range(60):
            code, status = self.call("GET", "/v1/video/jobs/" + jid)
            if status["status"] not in ("queued", "running"):
                break
            time.sleep(.1)
        self.assertEqual(status["status"], "succeeded", status)
        code, video = self.call("GET", "/v1/video/jobs/" + jid + "/result")
        self.assertEqual(code, 200)
        self.assertIn(b"ftypfakefile", video)
        self.assertTrue((self.root / "outputs" / (jid + ".mp4")).exists())
        self.assertTrue((self.root / "logs" / (jid + ".log")).exists())
        self.assertTrue((self.root / "jobs" / "video-jobs.sqlite3").exists())

    def test_validation_and_missing_jobs(self):
        code, response = self.call("POST", "/v1/video/jobs", {"prompt": "x", "frames": 24})
        self.assertEqual(code, 400)
        code, response = self.call("GET", "/v1/video/jobs/" + "a" * 32)
        self.assertEqual(code, 404)
        code, response = self.call("GET", "/v1/video/jobs/../../etc/passwd")
        self.assertEqual(code, 404)
        code, response = self.call("POST", "/v1/video/jobs/" + "a" * 32 + "/cancel")
        self.assertEqual(code, 404)


if __name__ == "__main__":
    unittest.main()
