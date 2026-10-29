# LTX 视频 HTTP 接入：新手三步完成

**想用其他程序调用你 Mac 上的 LTX 视频模型？** 按下面的三步操作即可。第一次只需要使用一个 Python 文件，不必先学 HTTP 请求、JSON 或 Java。

::: tip 先确认一个前提
你已经完成 [LTX-2.5 模型安装与首次生成](/mac/models/ltx25) 的前七步：模型已经下载、MLX 环境已安装，并且用命令行真正生成过可以播放的 MP4。

**只想自己生成视频的人不需要做本页。** 只有希望把 LTX 接入 Java、自动化或其他程序时才需要继续。
:::

## 第一步 · 把本地服务文件保存到 LTX 文件夹

在 Mac 的 Finder 里打开**你自己选的 LTX 项目文件夹**。在此文件夹打开终端；也可以在终端输入 `cd `，把文件夹从 Finder 拖入终端后回车。

确认此文件夹中已经有 `src`、`models`、`.tools` 等 LTX 部署文件，然后复制下面的**一条命令**：

~~~bash
curl -fL https://raw.githubusercontent.com/xrf64668/local-ai-deploy/main/examples/ltx_http/worker.py -o worker.py
~~~

**成功标志：** 当前文件夹出现 `worker.py`。它是本站的 HTTP 封装程序，底层依然调用你原来安装的 `ltx-2-mlx`，不会再下载一遍模型。

## 第二步 · 启动本地 HTTP 服务

继续在刚才的终端执行：

~~~bash
python3 worker.py start
~~~

**成功标志：** 出现 `LTX Local API: http://127.0.0.1:18080`。**这个终端保持打开**，它负责接收生成任务。

第一次启动时，程序会自动为这个项目创建私有 API 密钥，保存在项目内的 `.secrets/` 文件夹。你不必手动输入或复制它。

## 第三步 · 输入一句话，自动生成并保存视频

打开**第二个终端**，同样进入刚才的 LTX 项目文件夹，执行：

~~~bash
python3 worker.py generate "A small paper boat floating on a calm lake"
~~~

脚本会自动完成：**向 HTTP API 提交任务 → 等待生成 → 查询状态 → 下载 MP4**。不需要你复制 `job_id` 或反复发送请求。

**成功标志：** 终端显示「视频已保存到：…」，你在这个项目的 `outputs` 文件夹可以看到 `http-任务编号.mp4`。请用播放器打开视频，确认它真正生成成功。

::: warning 这里不是演示假视频
HTTP 服务调用的是本机已安装的真实 LTX CLI。网站的 GitHub Actions 只能用模拟模型测试 HTTP 流程；**能否在你的 Apple Silicon 设备上运行成功，还需要你在本机验证**。服务器启动成功不代表模型推理成功。
:::

## 出现问题怎么办？

| 看到的现象 | 怎么处理 |
| --- | --- |
| 找不到 `worker.py` | 先确认终端进入的是保存 LTX 的项目文件夹；重复第一步 |
| 提示缺少 `src`、`models` 或 `uv` | 尚未完成 [LTX 的安装与首次生成](/mac/models/ltx25) |
| 找不到 `ffprobe` | 安装 FFmpeg 并确认 `ffprobe -version` 正常 |
| 提示本地服务连接失败 | 检查第一个终端是否还在运行 `python3 worker.py start` |
| 提示任务失败 | 查看项目文件夹的 `logs` 日志；可能是权重、环境或内存问题 |
| 想停止服务 | 回到第一个终端按 `Ctrl+C` |

## 需要查看 HTTP 请求、Java 接入或完整接口吗？

下面是为开发者保留的进阶内容。**第一次使用可以直接跳过**。

::: details 展开：使用 curl 手动创建、查询和下载任务

服务默认仅监听本机 `127.0.0.1:18080`。打开 LTX 项目目录的终端，读取本项目的密钥（不要分享或提交到 Git）：

~~~bash
export LTX_API_KEY="$(cat .secrets/ltx-api-key)"
~~~

**创建异步任务：**

~~~bash
curl -sS -X POST http://127.0.0.1:18080/v1/video/jobs \
  -H "X-API-Key: $LTX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A paper boat on a quiet lake","width":512,"height":320,"frames":25,"frame_rate":24}'
~~~

HTTP 202 和 `queued` 表示服务器接收了任务，**还没有生成视频**。复制响应里真实的 `job_id`：

~~~bash
JOB_ID="替换成实际返回的32位job_id"
curl -sS -H "X-API-Key: $LTX_API_KEY" \
  "http://127.0.0.1:18080/v1/video/jobs/$JOB_ID"
~~~

状态变为 `succeeded` 后，再下载实际 MP4：

~~~bash
curl -fL -H "X-API-Key: $LTX_API_KEY" \
  "http://127.0.0.1:18080/v1/video/jobs/$JOB_ID/result" \
  -o outputs/http-result.mp4
~~~

本机验证：

~~~bash
ffprobe -v error \
  -show_entries format=duration,size -of json \
  outputs/http-result.mp4
~~~

也可以发送 `GET http://127.0.0.1:18080/health` 检查 HTTP 服务，但它不能证明已经完成视频生成。

:::

::: details 展开：完整 API 端点、状态与取消任务

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/health` | 检查本地 HTTP 服务（无需密钥） |
| POST | `/v1/video/jobs` | 创建任务，HTTP 202 |
| GET | `/v1/video/jobs/{id}` | 查询状态 |
| POST | `/v1/video/jobs/{id}/cancel` | 取消排队或终止正在生成的任务 |
| GET | `/v1/video/jobs/{id}/result` | 下载实际生成的 MP4 |

任务按 `queued → running → succeeded` 转换，失败或取消则分别进入 `failed`、`canceled`。不提供虚假的生成百分比；只有完成并验证输出后才会显示成功。

取消示例（需要先设置上面的 `JOB_ID` 和 `LTX_API_KEY`）：

~~~bash
curl -sS -X POST \
  -H "X-API-Key: $LTX_API_KEY" \
  "http://127.0.0.1:18080/v1/video/jobs/$JOB_ID/cancel"
~~~

默认同时只生成一个视频，排队最多八个任务；任务数据和提示词保存在本项目的 `jobs/video-jobs.sqlite3`，日志保存在 `logs/`，结果保存在 `outputs/`。

:::

::: details 展开：Java 17 / Spring Boot 调用示例

本站提供完整的 [Java 17 HttpClient 客户端源码](https://github.com/xrf64668/local-ai-deploy/blob/main/examples/ltx_http/LtxApiClient.java)。

在**你选择的 LTX 项目目录**打开终端，先读取项目密钥，再下载并运行客户端：

~~~bash
export LTX_API_KEY="$(cat .secrets/ltx-api-key)"

curl -fL https://raw.githubusercontent.com/xrf64668/local-ai-deploy/main/examples/ltx_http/LtxApiClient.java -o LtxApiClient.java

java LtxApiClient.java "A gentle river in a forest"
~~~

Java 示例通过 HTTP 创建任务、轮询状态并下载视频。在 Spring Boot 中可以将同一 HTTP 契约改成 RestClient 或 WebClient。视频生成时间较长，不建议让一个同步 HTTP 请求从开始一直阻塞到结束。

:::

::: details 展开：安全、运行限制和问题排查

- HTTP Worker **固定监听 `127.0.0.1`**；它不允许直接通过公网访问。
- 首次执行 `start` 时，自动在项目目录中创建只有当前用户可读取的 API Key。不要将 `.secrets`、`jobs`、`logs`、`outputs` 上传到公开 Git 仓库。
- 任务严格校验提示词、尺寸、帧数和帧率，不能由 HTTP 输入任意 Shell 参数、执行程序路径或输出文件路径。
- 固定使用低内存 distilled 路线，默认 512×320、25 帧、24fps。更大参数并不代表用户机器一定能够运行。
- `401` 表示授权失败；`429` 表示任务队列已满；`failed / inference_process_failed` 要查看项目中的 `logs/{job_id}.log`。
- 超时和取消会尝试终止推理子进程；服务重新启动不会自动重新运行未完成任务。
- 这个演示没有公网 TLS、网关限流、多用户隔离或生产级权限管理。**不要直接暴露到互联网**。
- 只有经过真实 MP4 输出和 `ffprobe` 检查，才是完整的端到端验收。CI 使用假的 CLI 做 HTTP 测试，并不表示实际 Mac 已生成过视频。

代码与测试：[Python Worker](https://github.com/xrf64668/local-ai-deploy/blob/main/examples/ltx_http/worker.py) · [离线 HTTP 测试](https://github.com/xrf64668/local-ai-deploy/blob/main/examples/ltx_http/tests/test_worker.py) · [Mac API 总览](/mac/07-api)。

:::

[返回 LTX 安装教程](/mac/models/ltx25) · [返回 Mac 07 · HTTP API 总览](/mac/07-api)
