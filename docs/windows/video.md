# Windows 视频模型：先确认显存，再选 LTX 或 Wan

[← 返回 Windows 配置与目标选择](/windows/)

这条路线针对 **Windows 10/11 64 位 + NVIDIA CUDA GPU**。先填写自己的 RAM、显存和磁盘空间，才能知道哪种视频模型值得进一步尝试。

## 01 · 查看显卡与空间

1. 打开「任务管理器 → 性能 → GPU」，确认专用显存。
2. 打开「设置 → 系统 → 关于」查看 RAM。
3. 在资源管理器查看计划安装磁盘的剩余容量。

PowerShell 中可额外执行：

```powershell
nvidia-smi
```

驱动无法正常读取时先处理驱动问题，不要因为模型能下载就认为 CUDA 已经可用。

## 02 · 选择一个具体的视频路线

| 模型 | 推荐入门方式 | 关键要求 |
| --- | --- | --- |
| **LTX-2.5 Fast** | [LTX Desktop 官方发布](https://github.com/Lightricks/LTX-Desktop/releases) | 官方推荐 24GB+ 显存、32GB RAM、100GB+ 磁盘 |
| **Wan2.2 TI2V-5B** | 对应 [ComfyUI 工作流](/comfyui/windows) 与 [上游原版权重](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B) | 具体显存与卸载配置需要核对，本站尚无统一实测配置 |

## 03 · LTX 路线（图形界面优先）

1. 打开 [LTX Desktop Releases](https://github.com/Lightricks/LTX-Desktop/releases)。
2. 选择 Windows x64 的官方安装包，下载并安装。
3. 首次启动时选择模型目录和下载位置，根据上游提示完成 Hugging Face 模型许可确认。
4. 在应用 Settings → Models 中安装需要的模型，先使用简单的文字生成短视频任务。
5. 在输出文件夹找到视频并播放。

**成功标志：** MP4 可播放。官方资源要求只是初筛，未验证的 GPU 架构与驱动仍可能导致运行失败。

## 04 · Wan 路线（进阶，暂不冒充完整验收）

先按 [Windows ComfyUI](/comfyui/windows) 安装好支持 CUDA 的环境，并加载明确要求 Wan2.2 权重的工作流。按流程检查文件清单与对应目录，再尝试小尺寸、短视频输出。

不要将 Mac MLX 版本、Wan 原版 PyTorch 或 LTX Desktop 模型包相互替换。

::: details 进阶：通过 API 控制工作流
等 ComfyUI 真正生成过视频后，再阅读 [ComfyUI API](/comfyui/api)。API 调通与生成模型可用是两种不同的验收结果。
:::

[返回 Windows 配置选型](/windows/) · [模型下载与科学上网](/guide/model-download)