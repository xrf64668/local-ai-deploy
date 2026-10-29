# LTX-2.5 MLX Q4 · 本地 HTTP API

本目录提供**真实 CLI 的 HTTP 包装层**，不是 LTX 官方自带 HTTP 服务。使用 Python 标准库，不需要 FastAPI、Redis、Docker。视频生成通过已安装的 ltx-2-mlx CLI 真正执行。

## 前提

先完成 [Mac LTX 部署教程](../../docs/mac/models/ltx25.md)中的模型权重下载、src/ 安装、独立 .tools/bin/uv 环境，以及一次 CLI 实际生成。安装 ffprobe 用于输出验证。

## 复制服务端脚本（在已选择的项目目录中执行）

~~~bash
curl -fL https://raw.githubusercontent.com/xrf64668/local-ai-deploy/main/examples/ltx_http/worker.py \
  -o "$PROJECT_ROOT/worker.py"
python3 -m py_compile "$PROJECT_ROOT/worker.py"
~~~

建议先审阅文件；生产环境请固定 Git Commit 和校验值，再运行。不执行未经审核的第三方安装脚本。

## 创建项目私有 API Key

~~~bash
mkdir -p "$PROJECT_ROOT/.secrets"
chmod 700 "$PROJECT_ROOT/.secrets"
python3 -c 'import secrets; print(secrets.token_urlsafe(36))' > "$PROJECT_ROOT/.secrets/ltx-api-key"
chmod 600 "$PROJECT_ROOT/.secrets/ltx-api-key"
export LTX_API_KEY="$(cat "$PROJECT_ROOT/.secrets/ltx-api-key")"
~~~

这是运行 API 的终端会话。Token 不要提交到 GitHub、截图或其他日志。

## 启动 HTTP 服务

~~~bash
python3 "$PROJECT_ROOT/worker.py" --project-root "$PROJECT_ROOT" --port 18080
~~~

默认仅监听 127.0.0.1，不自动暴露到公网。使用另一个终端测试时，需要设置同一个 PROJECT_ROOT 和 LTX_API_KEY。

~~~bash
curl -fsS http://127.0.0.1:18080/health
~~~

## 创建真实视频生成任务

~~~bash
curl -sS -X POST http://127.0.0.1:18080/v1/video/jobs \
  -H "X-API-Key: $LTX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A paper boat drifting on a quiet lake","width":512,"height":320,"frames":25,"frame_rate":24}'
~~~

成功返回 HTTP 202 和真实 job_id。返回的 queued 只表示已加入队列，不代表生成完成。

~~~json
{
  "job_id": "c6c6d8f2363a4e61bba7f7d2d665fb05",
  "status": "queued",
  "created_at": 1793280000,
  "started_at": null,
  "ended_at": null,
  "error": null
}
~~~

复制返回的真实 job_id 到变量后查询和下载：

~~~bash
JOB_ID="请填写上一步得到的32位job_id"
curl -sS -H "X-API-Key: $LTX_API_KEY" "http://127.0.0.1:18080/v1/video/jobs/$JOB_ID"

# 仅当 status = succeeded 才执行
curl -fL -H "X-API-Key: $LTX_API_KEY" \
  "http://127.0.0.1:18080/v1/video/jobs/$JOB_ID/result" \
  -o "$PROJECT_ROOT/outputs/http-result.mp4"
ffprobe -v error -show_entries format=duration,size -of json "$PROJECT_ROOT/outputs/http-result.mp4"
~~~

任务支持 POST /v1/video/jobs/{id}/cancel 来取消；GET /health 无须 API Key，其余接口要求 X-API-Key。

## Java 17 客户端

[完整 Java 示例](./LtxApiClient.java) 使用 JDK 17 HttpClient，实现创建任务、轮询、下载真实 MP4。先在 LTX 项目目录下载 Java 源文件，再执行：

~~~bash
java LtxApiClient.java "A boat floating on a calm lake"
~~~

程序把结果写在用户当前目录下的 outputs/，不会写死用户名或绝对路径。

## 安全、范围、验证

- 任务逐个执行，不并行加载多个 MLX 视频模型。队列默认最多 8 个。
- 实际模型推理、取消、超时由子进程控制；服务器运行在 Python 标准库 HTTPServer 中。
- 任务及提示词留在 PROJECT_ROOT/jobs/video-jobs.sqlite3；运行日志位于 logs/；MP4 输出位于 outputs/。
- 不允许用户输入命令行参数、脚本路径或自定义输出文件名；所有命令通过 argv 列表传递，不使用 shell=True。
- 完成状态依赖 CLI 返回码和 ffprobe 有效视频检查；仅成功创建任务不能算成功。
- 没有 CORS、远程认证网关、TLS、多租户隔离。不能把此示例直接当成公网生产服务。
- 本仓库 CI 只通过假 CLI 验证 HTTP 流程，没有在 CI 上运行 Mac Metal 和 LTX 权重；需要用户本机真实验证。

离线测试命令：

~~~bash
python3 -m unittest discover -s examples/ltx_http/tests -v
~~~
