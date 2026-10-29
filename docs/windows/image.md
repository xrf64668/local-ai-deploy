# Windows 图像模型：用 ComfyUI Desktop 生成第一张图

<DeploymentSelection />

[← 返回 Windows 配置与目标选择](/windows/)

第一次建议使用 **ComfyUI Desktop 图形界面**，而不是从复杂的 Python / CUDA 命令开始。

## 01 · 查看显卡

在「任务管理器 → 性能 → GPU」查看 NVIDIA 型号、专用显存。Windows PowerShell 可以额外运行：

```powershell
nvidia-smi
```

如果无法显示 NVIDIA GPU，先确认驱动正常，不要直接执行别人的 CUDA 安装命令。

## 02 · 从官方安装 ComfyUI

1. 打开 [ComfyUI 官方下载页](https://www.comfy.org/download)。
2. 安装 Windows Desktop 版本。
3. 按向导选择数据目录并等待基础环境完成。
4. 启动画布，确认工作流编辑器可以正常打开。

**成功标志：** 能打开 ComfyUI 画布、没有致命安装错误。

## 03 · 按选用的模板找模型

先打开一个基础文生图模板，再按模板说明下载对应权重。不要凭 `safetensors` 后缀判断它是 Checkpoint 还是 VAE。

请优先使用 Desktop 内置模板的模型提示和安装时所选的数据目录。若官方源无法访问，可根据网络条件使用科学上网。

## 04 · 生成第一张图片

设置简单提示词，保留模板的基础参数，执行并等待完成。**得到可打开的图片文件，才算成功**。

::: details 进阶：Portable、PowerShell 与 CUDA 自定义
如果需要插件或控制 Python，可以阅读 [Windows ComfyUI Desktop 与手动安装](/comfyui/windows)。不同安装方式的模型目录可能不同，不要混用。
:::

[ComfyUI 第一次生成图片](/comfyui/first-workflow) · [故障排查](/comfyui/troubleshooting)