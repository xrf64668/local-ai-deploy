# 模型内存计算的依据

[容量计算器](/recommend/) 使用模型结构和用户填写的硬件配置**重新计算容量**，不再通过固定的“8GB/16GB/32GB 门槛”判断。

## 数据从哪里来？

| 模型 | 参数量 | 层数 | 注意力头数 / KV 头数 | 隐藏维度 |
| --- | --- | --- | --- | --- |
| [Qwen2.5 0.5B](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/blob/main/config.json) | 0.49B | 24 | 14 / 2 | 896 |
| [Qwen2.5 1.5B](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct/blob/main/config.json) | 1.54B | 28 | 12 / 2 | 1536 |
| [Qwen2.5 3B](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct/blob/main/config.json) | 3.09B | 36 | 16 / 2 | 2048 |
| [Qwen2.5 7B](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct/blob/main/config.json) | 7.61B | 28 | 28 / 4 | 3584 |
| [Qwen2.5 14B](https://huggingface.co/Qwen/Qwen2.5-14B-Instruct/blob/main/config.json) | 14.7B | 48 | 40 / 8 | 5120 |
| [Qwen2.5 32B](https://huggingface.co/Qwen/Qwen2.5-32B-Instruct/blob/main/config.json) | 32.5B | 64 | 40 / 8 | 5120 |
| [Qwen2.5 72B](https://huggingface.co/Qwen/Qwen2.5-72B-Instruct/blob/main/config.json) | 72.7B | 80 | 64 / 8 | 8192 |

这些数据来自官方模型卡和配置文件，本站将其作为固定版本的结构资料，并不声称模型列表是实时同步的。

## 计算哪些部分？

**估算总量 = 权重 + KV 缓存 + 推理工作区预留**。

权重 ≈ 参数量 × 平均每参数字节。Q4_K_M、Q8_0、FP16 分别按约 0.60、1.0625、2 字节/参数估算。实际量化文件存在非均匀精度、对齐与元数据；因此计算器允许**输入实际 GGUF 文件大小**，覆盖这个近似值。

对于普通 Transformer 自回归模型，FP16 KV 缓存：

```text
KV 字节 = 2 × 层数 × KV头数 × 每头维度
        × 上下文长度 × 2字节 × 并发会话数

每头维度 = 隐藏维度 / 注意力头数
```

参考 [Hugging Face KV 缓存原理](https://huggingface.co/docs/transformers/kv_cache)。

推理工作区按 `max(0.8 GiB, 权重 × 15%)` 预留。这是透明的**工程估算**，尚未针对每一种运行时进行峰值校准。

## 与硬件容量怎样比较？

- **Apple Silicon：** 统一内存总量减去用户选择的系统预留。
- **Ubuntu / Windows NVIDIA：** 单卡显存减去显卡桌面、驱动等预留。

计算假设**整模型及 KV 均放入目标内存**；不模拟 GPU 层卸载、跨卡分布、KV 量化、滑动窗口、推理速度或吞吐。页面按估算占可用预算的比例分档：**优先推荐（≤70%）**、**可以尝试（70%–85%）**、**谨慎尝试（85%–100%）**、**超出预算（>100%）**。这组分档仅用于预留资源余量，不是官方硬件要求或速度预测。

注意：选择器使用常见的“GB”标称内存，估算时按 GiB 近似处理。GB 与 GiB 并不完全相同；实际可用空间应根据系统或 GPU 监控数据重新校对。

## 图片、视频与语音如何处理？

图片生成的峰值还取决于工作流、分辨率、VAE、节点和批大小；视频生成还与帧数、注意力实现及卸载方式有关。语音模型有不同的架构和缓冲需求。

**不能把 LLM 的 KV 公式套在这些任务上。** 视频模式会基于上游公布的硬件适配起点、所选平台和磁盘空间列出具体 LTX/Wan 候选；此筛选不是视频峰值内存计算。图片和语音继续提供部署路线；后续积累带设备、模型版本、分辨率、帧数与实际峰值的记录后再完善。

## 怎样把估算变成实测？

运行成功后记录：芯片或 GPU、系统版本、模型 revision、实际权重大小、上下文或图片尺寸、并发、内存峰值、耗时及结果文件。再根据这些记录校准计算模型。

可检查的实现：[计算代码](https://github.com/xrf64668/local-ai-deploy/blob/main/docs/.vitepress/data/model-memory.mjs) · [公式测试](https://github.com/xrf64668/local-ai-deploy/blob/main/tests/model-memory.test.mjs)。

视频候选数据文件：[model-video.mjs](https://github.com/xrf64668/local-ai-deploy/blob/main/docs/.vitepress/data/model-video.mjs) · [视频推荐规则测试](https://github.com/xrf64668/local-ai-deploy/blob/main/tests/model-video.test.mjs)。
