# 07 · Mac 本地模型开放 API

当本地模型已经验证成功后，可以让网站、iPhone 客户端、Java 服务或其他自动化工具通过 HTTP 调用它。

本页区分两条路线：

| 运行时 | 推荐接口方式 | 是否开箱即用 |
| --- | --- | --- |
| Ollama | 原生 `/api/chat`、`/api/tags` | 拉取模型并启动后直接可用 |
| ComfyUI | `/prompt`、`/history`、`/ws` | 需要有效 API 格式工作流 |
| LTX / Wan 的专用 MLX CLI | 本站实现了 LTX-2.5 本地 HTTP Worker；Wan 仍需专用适配器 | **LTX 有可运行示例，但仍需在目标 Mac 实测视频** |

## 方案 A：先用 Ollama 完成 HTTP 闭环

根据 [Ollama 的安装与下载指南](/mac/models/ollama) 安装并启动支持的模型后，检查：

```bash
curl -f http://127.0.0.1:11434/api/tags
```

**成功标志：** 返回已安装的模型列表。接下来将命令中的模型名改成 `ollama list` 显示的实际名称：

```bash
curl http://127.0.0.1:11434/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"model":"替换为实际模型名","messages":[{"role":"user","content":"你好"}],"stream":false}'
```

**成功标志：** HTTP 结果包含真实模型响应，不只是接口 200 或模型列表。

## 方案 B：ComfyUI 图像/视频工作流 API

如果模型以 ComfyUI 工作流运行，请先阅读 [ComfyUI API 教程](/comfyui/api) 与 [完整 Python 调用示例](https://github.com/xrf64668/local-ai-deploy/blob/main/examples/comfyui/submit_workflow.py)。

注意：ComfyUI 的普通工作流 JSON 不一定等于可执行的 API JSON；应从实际可运行工作流导出 API Format。

## 方案 C：LTX-2.5 CLI → 真正 HTTP Worker

**新手建议直接使用 [三步入门](/mac/models/ltx25-api)：** 下载 Worker → 输入 `python3 worker.py start` 启动 → 在第二个终端执行 `python3 worker.py generate "你的视频描述"`，脚本会自动提交、等待并下载 MP4。不需要自己处理密钥和任务编号。


**现在已经提供可运行的实现：** [LTX-2.5 本地 HTTP API 完整教程](/mac/models/ltx25-api) · [Python Worker 源码](https://github.com/xrf64668/local-ai-deploy/blob/main/examples/ltx_http/worker.py) · [Java 17 HttpClient 完整示例](https://github.com/xrf64668/local-ai-deploy/blob/main/examples/ltx_http/LtxApiClient.java)。

在用户自己的 LTX 项目目录中下载 `worker.py`，启动后可发 POST 创建异步任务，GET 查询状态，再从 GET `/result` 下载通过 ffprobe 校验的真实 MP4。

**注意：Wan2.2 的专用 MLX CLI 尚未接入这个 LTX Worker。** 后端采用明确的 LTX 模型路径和命令；不能用同一服务假称两种模型都已实现。

## 通用视频任务 API 契约

针对 LTX-2.5 与 Wan2.2 这样的模型，建议设计：

| HTTP 方法 | 资源 | 作用 |
| --- | --- | --- |
| POST | `/v1/video/jobs` | 校验参数、创建任务、返回 job_id |
| GET | `/v1/video/jobs/{id}` | 查询队列、进度、错误 |
| POST | `/v1/video/jobs/{id}/cancel` | 请求取消 |
| GET | `/v1/video/jobs/{id}/result` | 返回受控输出文件 |

### 处理流程

`queued → running → succeeded / failed / canceled`

- 必须根据 **已验证的真实 CLI** 实现 Adapter，不能用示例命令模拟生成完成。
- 任务执行前做模型能力校验、磁盘预算、全局 GPU 互斥、超时及取消处理。
- 日志不要出现 API Key；输出只能在允许的项目输出目录内。
- 同一台小内存 Apple Silicon 机器先限制 GPU 推理并发为 1。
- API 网关应具有鉴权、限流和安全下载机制。

::: warning 安全默认值
教学示例仅使用 `127.0.0.1`。即使加入 API Key，也不要不经 TLS/网关/权限审查，就将模型 API 直接监听 `0.0.0.0` 并暴露公网。
:::

## Java / Spring Boot 怎么接入

Java 后端优先用 HTTP Client 或 WebClient 调用现有模型 API。对于 LTX/Wan，客户端收到 `job_id` 后轮询或通过受保护的事件接口等待，而不是让一个 HTTP 请求保持数分钟。

**实现状态：** LTX HTTP Worker 已提供源码与离线 HTTP 测试；真实 Metal 推理仍须在目标 Mac 上验收。Wan MLX 的 HTTP 适配器仍未实现，不能宣称已经支持。

官方参考：[Ollama API](https://docs.ollama.com/api/introduction) · [ComfyUI 路由文档](https://docs.comfy.org/development/comfyui-server/comms_routes)
