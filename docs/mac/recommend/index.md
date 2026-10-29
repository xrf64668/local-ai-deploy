# Mac · Apple Silicon 模型容量计算

选择统一内存、量化、上下文与并发，系统会计算所选语言模型的**权重、KV 缓存和推理工作区**，并与系统预留后的内存预算比较。

<MacModelAdvisor />

## 计算结果能说明什么？

“有容量空间”表示按照当前参数**可以进一步尝试**，而不是保证 M 系列芯片、模型权重或运行时一定兼容。图片和视频的显存峰值受工作流、分辨率、帧数和内存卸载方式影响，需要实际验证。

[公式与误差说明](/recommend/how-it-works) · [Mac Ollama 安装](/mac/models/ollama) · [ComfyUI 安装](/comfyui/mac)
