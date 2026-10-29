# Mac · Apple Silicon 本地 AI 部署

从判断硬件开始，一步一步安装模型、运行推理，最后让其他程序通过 API 调用。本站把 **命令、成功标志、出错后的处理方式** 放在一起，不把“能安装”误写成“保证能运行”。

::: tip 新手先看这两条路线
- **想尽快试用大语言模型：** [Ollama 入门](/mac/models/ollama) → [07 API](/mac/07-api)
- **想生成图片：** [Mac 安装 ComfyUI](/comfyui/mac) → [首次生成](/comfyui/first-workflow) → [ComfyUI API](/comfyui/api)
:::

## 路线 A：Mac 01–07 全过程

| 阶段 | 你将完成什么 | 本阶段成功标志 |
| --- | --- | --- |
| [01 · 硬件预检](/mac/01-preflight) | 芯片、macOS、内存、磁盘、Metal | 确认 Apple Silicon，知道硬件上限 |
| [02 · 独立环境](/mac/02-environment) | 路径、venv、缓存隔离 | 项目依赖不会污染其他模型 |
| [03 · 运行时](/mac/03-runtime) | 选择 Ollama / MLX / ComfyUI | 明确权重与推理框架对应关系 |
| [04 · 模型下载](/mac/04-models) | 模型来源、版本、量化与文件 | 有来源记录，模型与运行时匹配 |
| [05 · 完整性校验](/mac/05-verify) | 文件、权重、加载、最小推理 | 实际生成有效输出，不只检查文件 |
| [06 · 本地推理](/mac/06-inference) | 分辨率、帧数、资源与日志 | 一次任务可复现且输出可打开 |
| [07 · API 服务](/mac/07-api) | 本地 HTTP、鉴权、任务状态 | 本机客户端请求成功并可处理失败 |

[查看七阶段设计和目录约定](/mac/roadmap)

## 路线 B：按模型选择

| 目标 | 页面 | 状态说明 |
| --- | --- | --- |
| 本地聊天 / Java 服务调用 | [Ollama 与原生 API](/mac/models/ollama) | 基于官方接口，可直接操作验证 |
| LTX-2.5 Q4 视频 | [LTX-2.5 MLX 路线](/mac/models/ltx25) | 有特定 M4/32GB 低负载实践记录，非通用性能保证 |
| Wan2.2 TI2V-5B | [Wan2.2 MLX 路线](/mac/models/wan22) | 实验性方案，必须目标机器验证 |
| 图片、视频节点工作流 | [Mac ComfyUI 入门](/comfyui/mac) | PyTorch MPS 路线，不等于 MLX |

## 先理解三件事

**统一内存不等于可以全部分给 GPU。** 系统、Metal、模型权重和生成过程共享统一内存；在 32GB 机器上同时运行多个大型视频任务，很容易出现内存压力。

**同一模型名字不等于权重格式兼容。** PyTorch、GGUF、MLX 各有加载规则。应先看运行时再选择权重。

**本站与实际部署项目相互独立。** 这个 VitePress 仓库存放文档和可检查的示例代码，不包含模型权重。独立的 `CUSTOM_DEPLOY` 部署项目请按其当前脚本版本操作，不要直接把文档里的阶段设计当作已经完成的安装脚本。

[Mac 排障清单](/mac/troubleshooting) · [按硬件选择模型](/recommend/)
