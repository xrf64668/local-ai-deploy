# LTX-2.5 本地 HTTP API

本站自行实现的 **LTX CLI → HTTP Worker**，非上游 LTX 官方自带 API。只依赖 Python 标准库；实际生成仍使用已安装的 `ltx-2-mlx generate`。

[适合新手阅读的三步教程](../../docs/mac/models/ltx25-api.md)

## 快速开始（在自己的 LTX 项目目录打开终端）

确保已完成模型下载、`src/` 安装、`.tools/bin/uv`、`ffprobe`，且至少一次 CLI 已生成可播放 MP4。

**第一次：下载 HTTP Worker**

~~~bash
curl -fL https://raw.githubusercontent.com/xrf64668/local-ai-deploy/main/examples/ltx_http/worker.py -o worker.py
~~~

**终端一：启动服务**

~~~bash
python3 worker.py start
~~~

**终端二：生成并下载视频**

~~~bash
python3 worker.py generate "A paper boat drifting on a quiet lake"
~~~

视频保存到同一项目的 `outputs/http-<job_id>.mp4`。启动命令会在项目内生成 `.secrets/ltx-api-key`，无需手动准备、粘贴或分享密钥。Worker 仍固定监听 `127.0.0.1:18080`，不自动暴露网络端口。

## 开发者接口

完整接口包括：`GET /health`，`POST /v1/video/jobs`，`GET /v1/video/jobs/{id}`，`POST /v1/video/jobs/{id}/cancel`，`GET /v1/video/jobs/{id}/result`。除健康检查外均需要 `X-API-Key`。

API 任务顺序运行，SQLite / 日志 / MP4 都位于用户选择的项目目录内，超时或取消时会尝试终止推理进程。Java 17 调用示例见 [LtxApiClient.java](./LtxApiClient.java)。

源码和自动测试不包含 MLX 权重；CI 使用假 CLI 检查 HTTP 逻辑，不能代表 Apple Silicon 上的模型生成验收。

离线测试：

~~~bash
python3 -m unittest discover -s examples/ltx_http/tests -v
~~~
