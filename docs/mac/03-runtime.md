# 03 · 选择正确的 Mac 推理运行时

一个模型能否启动，取决于 **模型结构 + 权重格式 + 推理框架 + 依赖版本** 的组合，而不是仅看名称。

## 常见选项

| 你想运行的模型 | 运行时 | 典型使用方式 | API |
| --- | --- | --- | --- |
| Qwen/Llama 等量化文本模型 | Ollama | 安装应用、拉取支持的模型 | 原生 HTTP |
| 语言模型的 Apple Silicon 推理 | MLX / mlx-lm | Python 或框架服务 | 按具体版本 |
| LTX-2.5 Q4 视频 | 专用 `ltx-2-mlx` 加载器 | 特定 MLX 转换权重 | 需要适配 CLI/Worker |
| Wan2.2 Q8 视频 | 兼容该权重的 MLX 视频运行时 | 实验性生成与验证 | 需要适配 CLI/Worker |
| 图像及视频节点工作流 | ComfyUI | PyTorch MPS、模型节点 | 自带工作流 API |

## 新手应该怎样选

### 想最快接入 HTTP API

先走 [Ollama 新手路线](/mac/models/ollama)。模型安装完成后可直接调用原生接口；不需要自己发明推理协议。

### 想通过节点做图片/视频

先走 [ComfyUI for Mac](/comfyui/mac)；这里主要是 PyTorch MPS，不要把 MLX 权重误以为一定能被 ComfyUI 节点读取。

### 想在 M4/32GB 上尝试视频

先阅读 [LTX-2.5 实践记录](/mac/models/ltx25) 和 [Wan2.2 实验性方案](/mac/models/wan22)。只下载与加载器匹配的版本，不要复用其他框架的 `config.json` 或文本编码器。

## 通过标准

记录推理后端的准确版本（Git Commit 或包版本）、Python 版本、权重 revision 及内存条件。**仅安装了 Python 包不代表模型已经通过测试**。

下一步：[04 · 模型下载与校验](/mac/04-models)。
