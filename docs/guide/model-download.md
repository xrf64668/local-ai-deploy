# 下载模型：先选平台，再选来源

本页帮你解决三个问题：**下载哪个版本、从哪里下载、下载完成后怎么确认文件可以使用**。选择模型时先看 [容量计算器](/recommend/)，再看下方对应的运行工具。

## 01 · 先选模型和运行工具

| 你的电脑和目标 | 优先选的工具 | 模型来源 | 实际部署步骤 |
| --- | --- | --- | --- |
| Mac / Ubuntu / Windows，文字聊天 | **Ollama** | [Ollama 模型库](https://ollama.com/library) | [Mac](/mac/models/ollama) · [Ubuntu](/ubuntu/ollama) · [Windows](/windows/ollama) |
| 三个平台，图片生成 | **ComfyUI** | 工作流官方模板及其列出的权重仓库 | [Mac](/comfyui/mac) · [Ubuntu](/comfyui/ubuntu) · [Windows](/comfyui/windows) |
| Mac，LTX-2.5 视频 | **ltx-2-mlx** | [LTX-2.5 MLX Q4](https://huggingface.co/dgrauet/ltx-2.5-mlx-q4) | [LTX Mac 全流程](/mac/models/ltx25) |
| Mac，Wan2.2 视频 | **mlx-video** | [Wan2.2 TI2V-5B MLX Q8](https://huggingface.co/Anes1032/Wan2.2-TI2V-5B-mlx-q8) | [Wan Mac 全流程](/mac/models/wan22) |
| Ubuntu / Windows，NVIDIA 视频 | **ComfyUI / PyTorch CUDA** | 上游官方模型及工作流对应版本 | [Ubuntu ComfyUI](/comfyui/ubuntu) · [Windows ComfyUI](/comfyui/windows) |

**不要只按模型名字下载。** 同一个模型可能分为 GGUF、MLX、PyTorch safetensors 等不同版本；运行工具不匹配，文件下完也可能无法加载。

## 02 · 按网络环境选择下载渠道

| 网络条件 | 推荐操作 | 适用范围 |
| --- | --- | --- |
| 国外网络，可直接访问官网 | 使用 Hugging Face、Ollama、模型开发者的官方仓库 | 优先，来源最清晰 |
| 国内网络，官方源可以正常访问 | 仍优先直接下载；慢时增加下载超时并重试 | 不需要额外设置 |
| 国内网络，官方 Hugging Face 访问受限 | 可根据网络条件使用**科学上网**访问官方仓库；或评估 ModelScope、第三方 HF 镜像 | 先核对模型 ID、版本、文件清单、许可证 |
| 有对应模型的 ModelScope 发布仓库 | 使用 ModelScope 官方下载工具 | 仅适用于 **ModelScope 上确实存在的那个模型** |

::: warning 国内镜像的边界
ModelScope 与 Hugging Face 是**不同模型仓库平台**。名字相近不代表文件、revision 或量化格式完全一致；不能把 ModelScope 上的 PyTorch 原版当成 MLX 转换版。

HF-Mirror 是**第三方社区镜像，不是 Hugging Face 官方服务**。仅在能够确认来源、文件完整性并接受服务风险时使用；受限模型和登录令牌优先走官方入口。不要把 token 发给陌生下载网站。
:::

## 03 · Ollama 模型：最简单的下载方式

完成对应系统的 Ollama 安装后，打开终端（Windows 使用 PowerShell）：

~~~bash
ollama pull qwen2.5:3b
ollama list
ollama run qwen2.5:3b
~~~

**这三行分别做什么？** 第一行下载模型；第二行确认下载列表；第三行真正运行模型。最后输入一句问题，收到回答才算成功。

模型标签需要从 [官方 Ollama 模型库](https://ollama.com/library/qwen2.5) 核对。Ollama 使用自己的模型存储与下载机制，**不使用**下方的 \`hf download\` 指令来直接管理 Ollama 内置模型。

## 04 · Hugging Face：Mac / Ubuntu 下载 MLX 等模型

先在 Finder（Ubuntu 可用文件管理器）中新建专用模型目录。Mac 可参考 [选择项目文件夹](/mac/02-environment)。接下来所有命令在**该项目目录**执行。

以 macOS 为例，先创建只用于下载的 Python 环境并安装 Hugging Face 官方下载工具：

~~~bash
python3 -m venv .download-venv
source .download-venv/bin/activate
python -m pip install -U huggingface_hub
export HF_HOME="$(pwd -P)/.cache/huggingface"
hf --help
~~~

**成功标志：** \`hf --help\` 能显示命令说明。首次下载安装工具需要有可访问的软件包来源。若 Python 版本与包不兼容，先按官方版本要求调整 Python。

先下载一个很小的测试文件，确认下载渠道正常：

~~~bash
hf download openai-community/gpt2 config.json --local-dir ./models/download-test
~~~

**成功标志：** \`models/download-test/config.json\` 存在。这个文件仅供验证网络，**不是用来生成视频的模型**。

下载真实 LTX / Wan 时使用对应模型页的**完整仓库 ID**和专门的 \`--local-dir\` 路径。对需要同意许可协议的模型，先到 Hugging Face 原仓库登录并获得访问权限，再在本机运行 \`hf auth login\`。访问受限时可能需要科学上网。

::: details 下载时怎么固定版本？
在 Hugging Face 的 Files / History 页面复制对应的 **Commit SHA**，下载时加 \`--revision <实际的Commit SHA>\`。这样下次重新部署不会意外得到更新后的文件版本。不要直接复制网页示例中的尖括号占位符。
:::

## 05 · 国内下载：ModelScope 和 Hugging Face 镜像

### A. 在 ModelScope 下载“确实存在”的模型

以 ModelScope 文档中提供的 Qwen3-0.6B 为例，在专用 Python 环境执行：

~~~bash
python -m pip install -U modelscope
modelscope download --model Qwen/Qwen3-0.6B \
  --local_dir ./models/Qwen3-0.6B
~~~

**成功标志：** 目标目录出现完整模型文件。这个例子用于熟悉 ModelScope 下载方式，不是 LTX 或 Wan 的替代权重。实际模型需先在 [ModelScope](https://modelscope.cn/models) 核对仓库 ID、格式和许可证。

### B. HF 社区镜像（可选）

如果官方 Hugging Face 访问不稳定，可以了解 [HF-Mirror](https://hf-mirror.com/) 的说明。Mac / Ubuntu 可在**单次命令**前临时指定：

~~~bash
HF_ENDPOINT=https://hf-mirror.com \
  hf download openai-community/gpt2 config.json \
  --local-dir ./models/mirror-test
~~~

**成功标志：** 下载得到正确配置文件。第三方镜像并不保证所有仓库、访问权限或大文件传输正常；大模型文件应再与上游仓库文件列表和可信校验信息比对。

Windows PowerShell 的临时写法：

~~~powershell
$env:HF_ENDPOINT = 'https://hf-mirror.com'
hf download openai-community/gpt2 config.json --local-dir .\models\mirror-test
Remove-Item Env:HF_ENDPOINT
~~~

如果不使用镜像，确保已取消之前设置的 \`HF_ENDPOINT\`，再从官方源下载。**不要把镜像地址永久写进全局环境配置**，避免影响其他项目。

## 06 · Windows 手动下载 Hugging Face 模型

先用资源管理器新建模型项目目录，打开 PowerShell，通过 \`cd\` 进入该目录。若已安装兼容 Python：

~~~powershell
py -3 -m venv .download-venv
.\.download-venv\Scripts\python.exe -m pip install -U huggingface_hub
$env:HF_HOME = (Join-Path (Get-Location).Path '.cache\huggingface')
.\.download-venv\Scripts\hf.exe download openai-community/gpt2 config.json --local-dir .\models\download-test
~~~

如果最后一行找不到 \`hf.exe\`，请先检查前面的安装日志和实际虚拟环境中生成的命令位置。下载正式模型时，将测试仓库 ID 换成**目标平台支持的实际仓库 ID**。

## 07 · 下载后怎样检查？

1. **核对文件**：权重、配置、文本编码器、VAE、tokenizer 是否与所选仓库的文件清单一致。
2. **检查文件大小**：只有几百字节的“权重文件”可能是错误页或 Git LFS 指针，不是真正权重。
3. **校验 SHA-256**：仅在官方发布了可信校验值时，才能对照验证；本机单独计算的哈希不能证明文件来自官方。
4. **运行最小任务**：模型能成功加载并产生回答、图片或视频，才算完成真实部署验证。

**下一步：** [Mac 模型下载与版本说明](/mac/04-models) · [ComfyUI 模型目录](/comfyui/models-and-paths) · [计算容量](/recommend/)。

参考：[Hugging Face 下载指南](https://huggingface.co/docs/huggingface_hub/guides/download) · [官方 CLI](https://huggingface.co/docs/huggingface_hub/guides/cli) · [ModelScope CLI](https://github.com/modelscope/modelscope/blob/master/docs/source/command.md)。