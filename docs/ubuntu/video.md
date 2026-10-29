# Ubuntu 视频模型：先判断资源，再分别部署

[← 返回 Linux 配置与目标选择](/ubuntu/)

视频模型比普通聊天模型更依赖 GPU 驱动、显存、系统内存、下载空间及专用运行时。**先完成 [Linux 配置选择](/ubuntu/) 的显存初筛，再选一种视频路线**，不要同时下载 LTX 与 Wan 的全部权重。

## 01 · 确认 CUDA 设备

```bash
cat /etc/os-release
nvidia-smi
free -h
df -h .
```

**成功标志：** 显示 NVIDIA GPU、正常驱动、内存和磁盘。没有桌面环境的远程 Ubuntu 服务器不适合直接照搬 Desktop 应用，需要选择带对应工作流的服务端路线。

## 02 · 选择具体模型路线

| 目标模型 | 推荐开始方式 | 适用边界 |
| --- | --- | --- |
| **LTX-2.5 Fast** | [官方 LTX Desktop](https://github.com/Lightricks/LTX-Desktop) | 官方推荐 24GB+ VRAM、32GB RAM、100GB+ 可用磁盘 |
| **Wan2.2 TI2V-5B** | [Wan 原始项目](https://github.com/Wan-Video/Wan2.2) 与相匹配的 ComfyUI 工作流 | 模型、文本编码器、VAE 和卸载策略须按上游核对；本站尚未完成固定配置实测 |

**这些不是可以互换的权重**。Mac 的 MLX Q8 不适用于 Ubuntu CUDA 路线。

## 03 · 路线 A：带桌面的 Ubuntu 安装 LTX

1. 打开 [LTX Desktop 官方 Releases](https://github.com/Lightricks/LTX-Desktop/releases)，根据自己的 CPU 架构选择 `AppImage` 或 `.deb` 发布包。
2. 阅读 [官方安装与硬件要求](https://github.com/Lightricks/LTX-Desktop/blob/main/docs/setup-and-settings.md)。
3. 安装、启动 LTX Desktop；首次配置模型存储位置。
4. 如模型受限，按模型发布方要求登录 Hugging Face 并接受许可证；在应用 Settings → Models 中下载需要的权重。
5. 先运行内置的小规模 Text to Video 任务。

**成功标志：** 生成可播放的视频，而不是下载器显示完成。资源不足时不要盲目强制启用高分辨率。

## 04 · 路线 B：Ubuntu 服务器与 Wan 工作流

先按 [Ubuntu ComfyUI](/comfyui/ubuntu) 安装并检查 CUDA，再选择确实支持 **Wan2.2 原版权重** 的对应工作流。

使用工作流指定的模型仓库与文件目录下载；通过 [模型与目录教程](/comfyui/models-and-paths) 确认所有组件，先生成短视频。**本站当前尚未提供一套经过实机验证的通用 Wan CLI 配置**，不能把选择了模型的页面当成已成功安装。

::: details 进阶：HTTP API
LTX Desktop 的接口与 ComfyUI 队列 API 不是一回事。使用 ComfyUI 工作流且真实生成成功以后，再看 [ComfyUI API](/comfyui/api)。
:::

[返回配置选型](/ubuntu/) · [国外/国内模型来源](/guide/model-download)