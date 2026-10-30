# Linux 本地 AI：先确认硬件，再选择模型类型

本栏目先覆盖 **Ubuntu 22.04+、NVIDIA CUDA** 的常见本地部署。其他 Linux 发行版、AMD/Intel GPU、纯 CPU 等方案会另行扩展；不要直接照搬 NVIDIA 的驱动和 CUDA 命令。

**先填写自己的配置，再选择一种目标。** 聊天、生成图片、生成视频和语音识别不需要混装到同一套 Python 环境。

<NvidiaUnifiedWizard platform="ubuntu" />

## 四条不同的部署路线（进阶参考）

| 想实现什么 | 对应的独立教程 | 成功标志 |
| --- | --- | --- |
| [语言模型：聊天与代码](/ubuntu/chat) | Ollama，按显存选择量化标签 | 模型回复文字 |
| [图像模型：生成第一张图片](/ubuntu/image) | NVIDIA CUDA + ComfyUI | 保存可打开的图片 |
| [视频模型：LTX / Wan](/ubuntu/video) | 官方 LTX Desktop / 已核对的对应工作流 | 生成可播放的 MP4 |
| [语音识别：Whisper](/ubuntu/audio) | whisper.cpp，多语言模型 | 一段语音变成文字 |

::: tip Linux 服务器用户
无桌面的 Ubuntu 服务器不适合直接照搬 GUI 应用的安装方式。建议先使用 [ComfyUI 服务端教程](/comfyui/ubuntu)，用 SSH 隧道在自己的电脑访问；LTX Desktop 的图形安装则适用于有桌面环境的机器。
:::

## 已经知道要下载什么？

[国内外下载说明](/guide/model-download) · [搜索公开模型仓库](/guide/model-search) · [跨平台容量计算](/recommend/)

::: details 进阶：需要自己控制驱动、容器、CUDA、模型目录或 API？
先执行 `nvidia-smi` 核对驱动和 GPU。驱动故障应先排查，不应通过反复安装 PyTorch 来修复。每条模型专项单独管理其运行时、权重及结果；HTTP API 作为完成真实生成后的可选功能。

[Ubuntu Ollama 完整命令](/ubuntu/ollama) · [Ubuntu ComfyUI 手动安装](/comfyui/ubuntu) · [ComfyUI API](/comfyui/api)
:::