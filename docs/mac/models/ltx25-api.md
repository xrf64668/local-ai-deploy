# LTX-2.5 MLX · 从本地 CLI 到真正 HTTP API

这是一套**可执行的本地 HTTP 服务示例**。适合已经用 MLX CLI 生成过 MP4、希望由 Java、自动化工具或其他客户端通过 HTTP 控制模型的人。

**LTX 上游的 CLI/Python Pipeline 并不自动等于 HTTP 服务。** 本站自行提供 `worker.py`：通过独立 Python HTTP 服务校验参数、创建任务，再调用实际安装在你项目中的 `ltx-2-mlx generate`，保存结果并提供下载。

## 01 · 先完成真实模型安装和生成

请先完成 [Mac LTX-2.5 Q4 第 01–07 步](/mac/models/ltx25)，确保当前项目里有：
- `src/`：来自上游的 `ltx-2-mlx` 代码，已执行 `uv sync --all-extras`；
- `.tools/bin/uv`：项目内的 uv；
- `models/ltx25-q4/`：完整 MLX 模型包；
- `outputs/`：用于保存视频；
- `ffprobe`：可用，且普通 CLI 真实生成过 MP4。

如果没有先完成这些要求，API 可能能启动，但真实任务仍会失败。

## 02 · 下载 HTTP Worker

在保存 LTX 的项目目录打开 Mac 终端：

~~~bash
PROJECT_ROOT="$(pwd -P)"
curl -fL https://raw.githubusercontent.com/xrf64668/local-ai-deploy/main/examples/ltx_http/worker.py \
  -o "$PROJECT_ROOT/worker.py"
python3 -m py_compile "$PROJECT_ROOT/worker.py"
~~~

脚本完整源代码：[worker.py](https://github.com/xrf64668/local-ai-deploy/blob/main/examples/ltx_http/worker.py)。只使用 Python 标准库，API 进程不会单独导入或安装 Metal/MLX。

## 03 · 配置本地 API Key 并启动服务

~~~bash
mkdir -p "$PROJECT_ROOT/.secrets"
chmod 700 "$PROJECT_ROOT/.secrets"
python3 -c 'import secrets; print(secrets.token_urlsafe(36))' > "$PROJECT_ROOT/.secrets/ltx-api-key"
chmod 600 "$PROJECT_ROOT/.secrets/ltx-api-key"
export LTX_API_KEY="$(cat "$PROJECT_ROOT/.secrets/ltx-api-key")"

python3 "$PROJECT_ROOT/worker.py" --project-root "$PROJECT_ROOT" --port 18080
~~~

**成功标志：** 终端出现 `http://127.0.0.1:18080`。此窗口作为长期运行的服务终端，按 Ctrl+C 退出。

## 04 · 发起 HTTP 请求

在第二个终端进入同一个项目目录：

~~~bash
PROJECT_ROOT="$(pwd -P)"
export LTX_API_KEY="$(cat "$PROJECT_ROOT/.secrets/ltx-api-key")"
curl -fsS http://127.0.0.1:18080/health
~~~

健康检查成功只证明 HTTP 服务器在运行。再执行：

~~~bash
curl -sS -X POST http://127.0.0.1:18080/v1/video/jobs \
  -H "X-API-Key: $LTX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A paper boat drifting on a quiet lake","width":512,"height":320,"frames":25,"frame_rate":24}'
~~~

**成功标志：** HTTP 202、唯一 job_id 和 queued 状态。请从真实响应复制 job_id：

~~~bash
JOB_ID="替换成实际返回的32位job_id"
curl -sS -H "X-API-Key: $LTX_API_KEY" \
  "http://127.0.0.1:18080/v1/video/jobs/$JOB_ID"
~~~

当返回 `succeeded` 后下载：

~~~bash
curl -fL -H "X-API-Key: $LTX_API_KEY" \
  "http://127.0.0.1:18080/v1/video/jobs/$JOB_ID/result" \
  -o "$PROJECT_ROOT/outputs/http-result.mp4"

ffprobe -v error -show_entries format=duration,size \
  -of json "$PROJECT_ROOT/outputs/http-result.mp4"
~~~

## 05 · HTTP API 文档

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/health` | 检查 HTTP 服务，无需密钥 |
| POST | `/v1/video/jobs` | 创建异步任务，返回 202 与 job_id |
| GET | `/v1/video/jobs/{id}` | 查询 queued、running、succeeded、failed、canceled |
| POST | `/v1/video/jobs/{id}/cancel` | 取消排队或终止当前任务 |
| GET | `/v1/video/jobs/{id}/result` | 任务 succeeded 后以 video/mp4 下载真实结果 |

取消任务示例：

~~~bash
curl -sS -X POST -H "X-API-Key: $LTX_API_KEY" \
  "http://127.0.0.1:18080/v1/video/jobs/$JOB_ID/cancel"
~~~

除 `/health` 外都需要请求头 `X-API-Key`。用户不能提交自定义 Shell 参数、可执行程序路径、任意输出路径；输入严格限制分辨率、帧数、帧率和提示词。任务默认依次执行，后台记录位于项目内的 `jobs/video-jobs.sqlite3`、`logs/` 和 `outputs/`。

## 06 · Java 17 完整客户端

完整示例：[LtxApiClient.java](https://github.com/xrf64668/local-ai-deploy/blob/main/examples/ltx_http/LtxApiClient.java)。不依赖 Spring 或第三方 JSON 库，使用 JDK 17 `HttpClient`：

~~~bash
curl -fL https://raw.githubusercontent.com/xrf64668/local-ai-deploy/main/examples/ltx_http/LtxApiClient.java \
  -o "$PROJECT_ROOT/LtxApiClient.java"

# 在存放模型的项目根目录运行，继承 LTX_API_KEY
cd "$PROJECT_ROOT"
java LtxApiClient.java "A gentle river flowing through a forest"
~~~

Java 示例会创建任务、轮询结果并下载到用户项目的 `outputs/`。在 Spring Boot 中可把相同的 HTTP 契约改成 WebClient/RestClient；长任务不要保持一个 HTTP 请求数分钟，应轮询 job_id。

## 07 · 运行限制与失败排查

- `401 unauthorized`：API Key 没带、长度不符或两边不一致。
- `400 invalid_request`：prompt、帧数或尺寸格式不合法，帧数必须满足 `8n+1`。
- `429 queue_full`：超过本机队列保护上限，稍后重试。
- `failed / inference_process_failed`：在项目 `logs/{job_id}.log` 查看上游 CLI 错误。
- `failed / invalid_video_output`：CLI 返回成功，但未获得有效可解码 MP4。
- `failed / timeout`：超过服务允许的推理时间；可调整启动参数 `--timeout`（最多 21600 秒）。

**安全：** 默认固定绑定 `127.0.0.1`，不提供公网访问、CORS、TLS、生产级鉴权或多租户隔离。不要直接暴露到互联网。提示词和日志仅保存在选定项目目录，API Key 不会传给推理进程。

**测试边界：** GitHub CI 运行无需模型权重的假 CLI 任务测试（检查真实 HTTP 接口、队列、错误处理和文件传输），**并未在 CI 的 Linux 运行器上实际执行 Apple Metal 模型**。只有用户在 Mac 上完成真实 MP4 生成，才构成模型实测通过。

[返回 LTX 模型安装](/mac/models/ltx25) · [Mac 07 · API 总览](/mac/07-api)
