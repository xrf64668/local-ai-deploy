# Mac · Apple Silicon 模型容量计算

选择统一内存、量化、上下文与并发，系统会先展示 **Qwen3.8、Gemma、DeepSeek、gpt-oss、Llama、Mistral** 等模型的容量初筛；需要核对传统 Transformer 的权重与 KV 缓存时，再展开经典架构的详细计算。

<MacModelAdvisor />

## 计算结果能说明什么？

“有容量空间”表示按照当前参数**可以进一步尝试**，而不是保证 M 系列芯片、模型权重或运行时一定兼容。选择**视频生成**时，会列出符合当前参考条件的 LTX-2.5 Q4、Wan2.2 Q8 或较轻量的 LTX-2.3 Q4，并提供模型仓库及安装教程。视频的内存峰值仍受分辨率、帧数和运行时影响，列表不是性能保证。

[公式与误差说明](/recommend/how-it-works) · [Mac Ollama 安装](/mac/models/ollama) · [ComfyUI 安装](/comfyui/mac)
