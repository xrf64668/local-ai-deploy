# ComfyUI 模型目录与权重说明

**重要：** ComfyUI 桌面版、便携版和手动安装版，可能使用不同的数据与模型目录。不要把模型下载到一个与你当前实例无关的文件夹。

## 常见目录

| 路径 | 通常存放 |
| --- | --- |
| `models/checkpoints/` | 含部分完整模型组件的 Checkpoint |
| `models/diffusion_models/` | 独立扩散模型权重 |
| `models/vae/` | 图像/视频解码所需 VAE |
| `models/loras/` | LoRA 微调权重 |
| `models/text_encoders/` | 文本编码器 |
| `models/controlnet/` | 相应 ControlNet 模型 |
| `custom_nodes/` | 自定义节点代码（不是通用权重目录） |

具体目录以模型提供方、工作流加载器及当前 ComfyUI 版本为准。

## 找不到模型的五步排查

1. 当前 ComfyUI 实例到底使用哪个模型根目录？
2. 你下载的是正确的模型版本、量化方式和完整组件吗？
3. 文件所在目录是否符合节点预期？
4. 工作流里引用的文件名是否与实际文件名一致？
5. 目录或模型列表是否需要刷新/重启？

## 多个模型项目共享权重？

可以通过 **ComfyUI 支持的额外模型目录配置** 让不同实例读取已有模型文件，但先确认读写权限、版本兼容和目录映射。不要随意移动已经成功运行的其他项目的权重。

详细参考 [ComfyUI 官方文档](https://docs.comfy.org/) 与 [第一次生成](/comfyui/first-workflow)。
