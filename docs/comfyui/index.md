# ComfyUI：从零开始

本章节是 **Mac、Ubuntu、Windows 通用的新手入口**。目标不是只把程序打开，而是完成「环境检查 → 安装 → 下载模型 → 第一次生成 → API 验证」的完整流程。

> **重要区分：** 安装 ComfyUI ≠ 安装模型；能打开网页 ≠ GPU 推理成功。每个阶段都要核对成功标志。

## 选择你的系统

| 系统 | 推荐路线 | 适合人群 |
| --- | --- | --- |
| [Mac（Apple Silicon）](/comfyui/mac) | 官方桌面版优先，或手动创建隔离的 Python 环境 | M 系列芯片、新手及开发者 |
| [Ubuntu + NVIDIA](/comfyui/ubuntu) | 手动安装、独立虚拟环境、CUDA PyTorch | Linux 桌面与 GPU 服务器 |
| [Windows + NVIDIA](/comfyui/windows) | 官方桌面版优先，或手动安装 | Windows PC、初次接触工作流的用户 |

## 每篇教程怎么读

1. **环境检查**：确认系统、CPU/GPU、内存或显存、硬盘空间。
2. **安装步骤**：每一步明确命令或操作、完成后看到的结果。
3. **启动验证**：确认本机 Web 服务可访问，控制台没有致命错误。
4. **模型与工作流**：选择匹配当前硬件的模型，按要求放置组件。
5. **首次生成**：实际生成文件，检查文件输出与可复现参数。
6. **接口调用**：根据任务需要，通过 API 提交工作流并查询结果。
7. **故障排查**：使用具体报错关键词定位依赖、设备、模型或节点问题。

## 先理解几个基础概念

- **ComfyUI**：通过节点及工作流组织模型推理的应用，并提供服务端 API。
- **工作流（Workflow）**：描述如何加载模型、传入文本和图像、执行采样与保存结果的节点关系。
- **Checkpoint / VAE / LoRA / 文本编码器**：不同模型可能需要的不同类型权重，不能只凭后缀判断目录。
- **MPS、CUDA、MLX**：Apple Silicon 上的 ComfyUI 通常走 PyTorch MPS；NVIDIA 走相应 CUDA PyTorch；MLX 是另一套运行时，并非可以直接与所有 ComfyUI 权重混用。

## API 与公网安全

ComfyUI 本地服务通常提供 `/system_stats`、`/prompt`、`/queue`、`/history` 和 `/ws` 等接口。调用视频或图片生成时，先提交有效的 API 工作流，再根据任务 ID 查询结果。参考[官方 API 路由文档](https://docs.comfy.org/development/comfyui-server/comms_routes)。

**不要未经鉴权就把 ComfyUI 端口直接暴露到互联网。** 本站默认所有教学命令仅监听本机地址。

## 官方参考资料

- [ComfyUI 官方安装说明](https://docs.comfy.org/installation/manual_install)
- [ComfyUI 官方仓库](https://github.com/Comfy-Org/ComfyUI)
- [ComfyUI 服务 API 说明](https://docs.comfy.org/development/comfyui-server/comms_routes)
