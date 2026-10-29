# 04 · 选择模型并下载正确的权重

**本阶段目标：** 知道“这台 Mac 该用哪个模型版本”，把对应权重下载到自己选定的项目目录，并检查完整性。不要一开始就下载几十 GB。

::: tip 先选模型，后选下载方式
如果还不知道要选哪条路线，先打开 [跨系统模型下载指南](/guide/model-download)。那里比较了 Ollama、Hugging Face、ModelScope，以及国内网络和国外网络的下载方式。
:::

## 第一步：根据任务选择模型

| 想完成什么 | 新手建议 | 模型格式 / 下载渠道 | 需要的工具 |
| --- | --- | --- | --- |
| 文字聊天、代码辅助 | 先从 Qwen2.5 3B 入手 | [Ollama qwen2.5:3b](https://ollama.com/library/qwen2.5:3b)，可直接拉取 | Ollama |
| 更多参数的文字模型 | Qwen2.5 7B、14B，先评估内存 | [Ollama 模型库](https://ollama.com/library/qwen2.5) | Ollama |
| 图像生成 | 使用官方文生图模板 | 按 ComfyUI 工作流所列权重下载 | ComfyUI / MPS |
| LTX 视频 | LTX-2.5 MLX Q4（进阶，文件很大） | [dgrauet/ltx-2.5-mlx-q4](https://huggingface.co/dgrauet/ltx-2.5-mlx-q4) | ltx-2-mlx |
| Wan 视频 | Wan2.2 TI2V-5B MLX Q8（实验性） | [Anes1032/Wan2.2-TI2V-5B-mlx-q8](https://huggingface.co/Anes1032/Wan2.2-TI2V-5B-mlx-q8) | mlx-video |

**为什么按运行工具区分？** GGUF 语言模型、MLX 转换模型和 ComfyUI/PyTorch 模型，不是下载同一个文件就能互用。

初步评估内存时查看 [Mac 模型容量计算器](/mac/recommend/)；视频不能只按参数量精确估算峰值。

## 第二步：确认真正要下载多少

| 模型版本 | 当前上游列出的文件量级 | 额外提醒 |
| --- | --- | --- |
| Ollama qwen2.5:3b | 约 1.9 GB | 还需运行时内存与磁盘余量 |
| LTX-2.5 MLX Q4 | 模型包约 42–47 GB | 有权重授权/许可证要求，内含多个变体与辅助组件 |
| Wan2.2 TI2V-5B MLX Q8 | 模型包约 19.6 GB | 文本编码器和 VAE 占据较大空间，只有主模型文件不够 |

上述容量来自所链接的发布页面，**可能随 revision 调整**。下载前打开仓库的 Files 页面核对真实大小。请在选定的模型项目目录中执行：

~~~bash
df -h .
~~~

**成功标志：** 能看到剩余空间。大模型建议预留超过模型包大小的空间，兼顾缓存、临时文件与生成结果。

## 第三步：使用与你的网络相符的下载方式

### 路线 A · Ollama 直接下载

~~~bash
ollama pull qwen2.5:3b
ollama list
~~~

这是 Ollama 自带的下载方式。下载好的模型由 Ollama 自行管理，无须手动复制到 ComfyUI 的模型目录。

### 路线 B · Hugging Face 官方权重

先按照 [跨系统下载指南](/guide/model-download) 安装官方 \`hf\` 下载工具，并在项目目录配置 \`HF_HOME\`。例如 LTX 和 Wan 使用以下两个**不同的仓库**：

- [LTX-2.5 Q4 的下载命令与安装过程](/mac/models/ltx25)
- [Wan2.2 Q8 的下载命令与安装过程](/mac/models/wan22)

### 路线 C · 国内网络

- 官方源能正常访问：优先使用官方源。
- 官方 Hugging Face 无法访问：可视网络条件通过**科学上网**访问官方仓库。
- 也可以了解第三方 HF 社区镜像；涉及令牌、受限许可或大文件时应考虑来源与完整性风险。
- 对于已经在 ModelScope 发布的模型，可以使用它的官方 CLI；**必须确认下载的是相同格式的具体模型**。

操作方法和 Windows PowerShell 示例集中在 [国内与国外下载指南](/guide/model-download)，不需要在这里重复几十行命令。

## 第四步：下载完成后校验

1. 到模型发布页面复制仓库和 commit revision，记录到部署日志。
2. 核对文件清单、文件大小，以及文本编码器、VAE、tokenizer 等辅助组件。
3. 如果上游提供 SHA-256，使用 \`shasum -a 256 文件名\` 计算并对照。
4. 确认模型实际加载，再运行最小生成任务；**下载成功只是第一步**。

::: warning 不要自己补造模型配置
如果缺少 \`config.json\` 或其他文件，先核对是不是下载了错误仓库、错误 revision 或不完整组件。不要拿别的模型配置直接拼在一起。
:::

**下一步：** [05 · 真实推理验证](/mac/05-verify) · [返回 Mac 部署总览](/mac/)。