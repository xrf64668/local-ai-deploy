# Qwen3.8-27B：Mac / Ubuntu / Windows 本地部署

这是 Qwen 官方于 **2026 年 8 月 14 日**发布的 27B 多模态模型。它既适合尝试代码与推理任务，也支持图片理解；本教程优先使用 Ollama 已发布的 `qwen3.8:27b` 标签，不要求新手自行转换 safetensors。

## 01 · 先确认模型和硬件

| 项目 | 本教程使用 |
| --- | --- |
| 模型 | [Qwen3.8-27B 官方模型卡](https://huggingface.co/Qwen/Qwen3.8-27B) |
| 可直接运行的版本 | [Ollama qwen3.8:27b](https://ollama.com/library/qwen3.8:27b) |
| 标签默认量化 | Q4_K_M（根据 Ollama 模型详情） |
| 下载文件 | 约 **18GB**，以实际模型库标签为准 |
| 架构 | Gated DeltaNet + 全注意力、视觉编码器 |
| 适用平台 | 配备相容 Ollama 版本的 Mac、Ubuntu 或 Windows |

**32GB Mac 可以作为本地尝试起点，但不代表可以直接使用 256K 上下文。** 长上下文、视觉输入、多个并发请求会改变内存压力；Windows/Ubuntu 要留意 NVIDIA 单卡显存与 CPU 卸载方案的区别。

## 02 · 安装 Ollama

打开对应系统的教程，按步骤完成安装并确认 `ollama --version` 正常输出：

- [Mac 安装 Ollama](/mac/models/ollama)
- [Ubuntu 安装 Ollama](/ubuntu/ollama)
- [Windows 安装 Ollama](/windows/ollama)

## 03 · 下载模型

在终端或 PowerShell 中执行：

```bash
ollama pull qwen3.8:27b
ollama list
```

**成功标志：** 下载完成后，`ollama list` 能显示 `qwen3.8:27b`。

国内网络如果无法访问 Ollama 官方模型服务，可根据当前网络条件通过**科学上网**访问。ModelScope 或 Hugging Face 的原始 safetensors 不等于 Ollama 的默认模型标签，不应直接放进 Ollama 内部存储目录。完整区别见 [国内外下载指南](/guide/model-download)。

## 04 · 第一次运行与验证

```bash
ollama run qwen3.8:27b
```

输入：`请说明为什么一个 27B 模型和一个 27B 量化模型的内存占用可能不同。`

**成功标志：** 收到真实生成的回答。提示词、初始化时间和内存压力与系统配置有关。按 `/bye` 离开对话。

## 05 · 本地 API

先确认 Ollama 应用仍在运行：

```bash
curl -f http://127.0.0.1:11434/api/tags
```

向模型发出请求：

```bash
curl http://127.0.0.1:11434/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"model":"qwen3.8:27b","messages":[{"role":"user","content":"你好，请用一句话介绍自己"}],"stream":false}'
```

**成功标志：** 返回包含模型回答的 JSON。Windows PowerShell 可使用 `curl.exe` 而非 `curl` 别名。

## 06 · 为什么推荐器不把它当成普通 27B 来精算？

Qwen3.8-27B 采用 64 层混合结构，其中全注意力层与 Gated DeltaNet 线性注意力层交替出现，还有视觉编码器。把它当成 64 层普通 Transformer 计算完整 KV 缓存，会造成不正确的内存估算。

本站目前使用 **Ollama 标签的真实发布文件大小 + 明确标注的工作区和上下文保护性余量** 来做容量初筛。保护性余量并非实测峰值，也不是严格的 DeltaNet 状态计算。最终是否运行成功，应以本机实际日志、内存占用和生成结果为准。

[返回跨厂商容量推荐](/recommend/) · [查看计算依据](/recommend/how-it-works)

参考：[Qwen 官方发布](https://github.com/QwenLM/Qwen3.8) · [Qwen3.8-27B 模型卡](https://huggingface.co/Qwen/Qwen3.8-27B) · [Ollama 标签详情](https://ollama.com/library/qwen3.8:27b)。
