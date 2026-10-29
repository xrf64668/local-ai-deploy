#!/usr/bin/env python3
"""提交 ComfyUI API Format JSON，轮询历史并返回任务输出元数据。

仅依赖 Python 3.10+ 标准库。
用法: python3 submit_workflow.py workflow_api.json
默认使用 http://127.0.0.1:8188。
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


def request_json(base: str, endpoint: str, data: dict | None = None) -> dict:
    url = base.rstrip("/") + endpoint
    headers = {"Accept": "application/json"}
    payload = None
    if data is not None:
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = Request(url, data=payload, headers=headers, method="POST" if payload is not None else "GET")
    try:
        with urlopen(req, timeout=30) as response:
            raw = response.read(4 * 1024 * 1024 + 1)
    except HTTPError as exc:
        details = exc.read(8192).decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}：{details}") from exc
    except URLError as exc:
        raise RuntimeError(f"无法连接 {url}: {exc.reason}") from exc
    if len(raw) > 4 * 1024 * 1024:
        raise RuntimeError("响应过大，已停止")
    try:
        result = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError) as exc:
        raise RuntimeError("API 没有返回合法 JSON") from exc
    if not isinstance(result, dict):
        raise RuntimeError("API 结果不是 JSON 对象")
    return result


def load_graph(path: Path) -> dict:
    if not path.is_file():
        raise ValueError(f"找不到工作流文件: {path}")
    try:
        graph = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise ValueError(f"工作流读取失败: {exc}") from exc

    # 也允许读入已经包装的 {"prompt": {...}} 文件。
    if isinstance(graph, dict) and isinstance(graph.get("prompt"), dict):
        graph = graph["prompt"]
    if not isinstance(graph, dict) or not graph:
        raise ValueError("API 工作流必须是非空 JSON 对象")
    if not all(
        isinstance(node, dict)
        and isinstance(node.get("class_type"), str)
        and isinstance(node.get("inputs"), dict)
        for node in graph.values()
    ):
        raise ValueError("这不是 ComfyUI API Format 节点图，请重新导出 API 格式工作流")
    return graph


def main() -> int:
    parser = argparse.ArgumentParser(description="ComfyUI HTTP API 提交/查询工作流")
    parser.add_argument("workflow", type=Path, help="已运行成功并导出的 API 格式 JSON")
    parser.add_argument("--url", default="http://127.0.0.1:8188", help="ComfyUI 服务地址（默认仅本机）")
    parser.add_argument("--timeout", type=int, default=600, help="等待的最多秒数")
    parser.add_argument("--interval", type=float, default=2.0, help="轮询间隔秒数")
    args = parser.parse_args()

    if args.timeout <= 0 or args.interval <= 0:
        parser.error("--timeout 与 --interval 必须大于 0")
    parts = urlsplit(args.url)
    if parts.scheme not in {"http", "https"} or not parts.hostname or parts.username:
        parser.error("--url 必须是合法的 http(s) 服务 URL，且不能包含用户凭据")

    try:
        graph = load_graph(args.workflow)
        stats = request_json(args.url, "/system_stats")
        print("API 连通；设备：")
        print(json.dumps(stats.get("devices", []), ensure_ascii=False, indent=2))

        result = request_json(args.url, "/prompt", {
            "prompt": graph,
            "client_id": str(uuid.uuid4())
        })
        prompt_id = result.get("prompt_id")
        if not isinstance(prompt_id, str) or not prompt_id:
            raise RuntimeError("提交未成功: " + json.dumps(result, ensure_ascii=False))
        print("任务已提交，prompt_id =", prompt_id)

        deadline = time.monotonic() + args.timeout
        while time.monotonic() < deadline:
            history = request_json(args.url, "/history/" + prompt_id)
            item = history.get(prompt_id)
            if isinstance(item, dict):
                status = item.get("status") if isinstance(item.get("status"), dict) else {}
                print(json.dumps({
                    "prompt_id": prompt_id,
                    "status": status,
                    "outputs": item.get("outputs", {}),
                }, ensure_ascii=False, indent=2))
                success = status.get("completed") is True and status.get("status_str") != "error"
                if success:
                    print("任务已完成；请按输出元数据读取实际文件。")
                    return 0
                print("任务执行失败或状态不确定，请查看 ComfyUI 日志。", file=sys.stderr)
                return 2
            time.sleep(args.interval)

        print(f"等待 {args.timeout} 秒超时。任务可能仍在运行；prompt_id={prompt_id}", file=sys.stderr)
        return 3
    except (ValueError, RuntimeError) as exc:
        print(f"错误: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
