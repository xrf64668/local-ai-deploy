# Windows 本地 AI：根据硬件选择模型类型

本栏目优先覆盖 **Windows 10/11 64 位 + NVIDIA GPU**，同时为 Ollama 聊天和 Whisper 提供不依赖 CUDA 的入门方向。AMD/Intel GPU 的专用部署还在扩展，不能将 NVIDIA CUDA 安装步骤直接套用。

**先填内存、显存和磁盘，再选一个自己要完成的目标。** Windows 的安装、路径和 PowerShell 命令不与 Linux 或 Mac 混用。

<NvidiaGoalAdvisor platform="windows" />

## 四条不同的部署路线

| 我的目标 | 独立教程 | 第一次成功的标志 |
| --- | --- | --- |
| [语言模型：本地聊天](/windows/chat) | Ollama 官方 Windows 安装包 | 能回答问题 |
| [图像模型：ComfyUI](/windows/image) | Desktop 图形界面优先 | 真正生成图片 |
| [视频模型：LTX / Wan](/windows/video) | LTX Desktop 或 ComfyUI 专用工作流 | 得到可播放 MP4 |
| [语音识别：Whisper](/windows/audio) | whisper.cpp 的独立本地项目 | 识别一段真实录音 |

::: tip 完全没有开发经验？
先走图形安装。打开软件、下载一个适合本机的模型并完成第一次生成，就已经达到入门目标。**不用先学 Java、Docker 或 HTTP API。**
:::

## 模型下载和进阶选型

[按硬件推荐模型](/recommend/) · [官方模型搜索](/guide/model-search) · [国内与国外下载](/guide/model-download)

::: details 进阶：PowerShell、CUDA 与手动环境
NVIDIA 驱动和 CUDA 的兼容性需要按 GPU 型号核对。ComfyUI 的 Desktop、Portable 与手动安装版是不同路线，**不要混用 Python 环境和模型路径**。

[Windows Ollama 详细教程](/windows/ollama) · [ComfyUI Windows 手动安装](/comfyui/windows) · [ComfyUI API](/comfyui/api)
:::