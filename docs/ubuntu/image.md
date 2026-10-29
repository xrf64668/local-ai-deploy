# Ubuntu 图像模型：使用 ComfyUI 生成第一张图

[← 返回 Linux 配置与目标选择](/ubuntu/)

图像模型建议通过 **ComfyUI + NVIDIA CUDA** 运行。与视频 LTX/Wan、Ollama 聊天是独立环境，不需要全部安装。

## 01 · 先检查 NVIDIA 显卡和驱动

在 Ubuntu 终端执行：

```bash
nvidia-smi
df -h .
```

**成功标志：** 能读取 GPU 型号、驱动与显存。驱动不可用时先排障；安装 PyTorch 不会自动修复坏掉的内核驱动。

## 02 · 安装 ComfyUI

Ubuntu 桌面和服务器可以使用**项目内 Python 虚拟环境**。阅读 [Ubuntu ComfyUI 完整安装](/comfyui/ubuntu)，按当前驱动从官方选择正确的 PyTorch CUDA wheel；不要直接安装其他电脑适用的版本。

**成功标志：** 本机浏览器显示 ComfyUI 画布。远程服务器优先使用 SSH 端口转发，不要直接公开 8188。

## 03 · 从工作流确定下载哪些文件

进入 ComfyUI 的基础文生图工作流，记录所需的 Checkpoint、UNet、VAE、文本编码器，再按要求下载。不同模型的组件不能随便混合。

[模型下载来源和目录](/comfyui/models-and-paths) · [国内/国外下载说明](/guide/model-download)

## 04 · 第一次生成

先以工作流默认低分辨率生成一张图片，保存输出文件并打开查看。遇到 CUDA OOM 时应减小分辨率、批量，或选更轻量的工作流。

**成功标志：** 得到可打开的实际图像，而不是只看到节点编辑器。

::: details 进阶：API 和节点调试
模型成功生成后再进入 [ComfyUI HTTP API](/comfyui/api) 和 [常见错误](/comfyui/troubleshooting)，新手不用先处理任务队列和 WebSocket。
:::