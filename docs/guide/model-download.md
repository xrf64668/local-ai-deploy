# 新手下载模型：从找到仓库到开始运行

**先选对模型，再下载。** 第一次不用看懂所有技术名词，只要按步骤找到可信来源、选对版本、复制与你电脑相符的下载命令，最后确认文件已下载成功。

## 第一步 · 我想做什么？

| 目标 | 先去哪里找 | 新手常用的运行工具 |
| --- | --- | --- |
| **文字聊天 / 编程** | [Ollama 模型库](https://ollama.com/library) | Ollama（Mac、Ubuntu、Windows） |
| **生成图片** | [ComfyUI 新手教程](/comfyui/first-workflow) | ComfyUI 与模板对应权重 |
| **生成视频** | [按设备选视频模型](/guide/deploy) | Mac MLX 或 NVIDIA CUDA，取决于设备 |

如果已经知道模型名称，比如 Qwen3.8、LTX、Wan，请直接打开 [搜索官方模型仓库](/guide/model-search)。

## 第二步 · 看清仓库和版本

同一个名字通常会有多种发布格式。**找到模型不等于找到了适合你电脑的版本。**

- **Ollama**：在模型库找到准确的 `模型名:标签`，例如 `qwen2.5:3b`。
- **Mac MLX**：确认模型仓库明确支持 Apple Silicon + MLX，不能拿原始 PyTorch 文件直接替换。
- **ComfyUI / NVIDIA**：先找到能运行的模板或工作流，再下载其明确要求的模型文件。

看不懂版本没关系：请先在 [按自己的电脑配置选模型](/guide/deploy) 中选择系统、内存或显存，查看本站已经核对过的候选。

## 第三步 · 选下载渠道

| 当前网络 | 建议怎么做 |
| --- | --- |
| 官方模型仓库能打开 | **优先直接从官方源下载** |
| 国内网络访问官方源较慢或受限 | 根据网络条件使用**科学上网**访问原始仓库 |
| 希望使用 ModelScope | 先确认它确实发布了**相同格式和版本**的权重 |
| 想尝试第三方 Hugging Face 镜像 | 只用于公开且能核对的文件，不要把访问令牌交给第三方 |

不要因为 ModelScope 上有同名模型，就假设它等于 Hugging Face 上的 MLX Q4 转换权重。

## 第四步 · 复制下载命令

**A. Ollama：最适合第一次本地聊天**

先通过 [Mac](/mac/models/ollama)、[Ubuntu](/ubuntu/ollama) 或 [Windows](/windows/ollama) 教程装好 Ollama。下面是轻量示例，不代表最适合你设备的唯一版本：

```bash
ollama pull qwen2.5:3b
ollama list
ollama run qwen2.5:3b
```

第一行下载，第二行检查列表，第三行实际提问。**收到模型回答，才算首次运行成功。**

**B. LTX / Wan：Mac 视频模型**

先到 [模型下载路线](/guide/deploy) 选择 Mac、统一内存、磁盘空间以及 LTX 或 Wan。页面会给出正确的 Hugging Face 仓库、独立下载环境与适用指令；不要直接粘贴别的电脑上的绝对路径。

**C. 在搜索中找到其他 Hugging Face 模型**

点击 [实时搜索](/guide/model-search)，找到具体仓库，再点「查看下载方法」选择系统。模型未审核前，下载指令只用于帮助你取得文件，**不代表已通过硬件兼容性验证**。

## 第五步 · 怎么判断下载完成？

1. 终端或软件显示下载结束，**没有错误**。
2. 模型文件夹能看到对应仓库 Files 列出的权重与必要组件，而不只是几个很小的说明文件。
3. 使用正确的运行工具加载权重，完成第一次文字回答、图片或 MP4 生成。

**只有真实运行并产生结果，才算部署成功。** 模型仓库的下载数字不等于显存峰值。

[按自己的设备生成下载命令](/guide/deploy) · [回到部署路线](/guide/start)

::: details 进阶：Hugging Face 下载工具如何安装？（Mac / Ubuntu）
在自己新建的模型项目文件夹打开终端，再执行：

```bash
PROJECT_ROOT="$(pwd -P)"
export HF_HOME="$PROJECT_ROOT/.cache/huggingface"
export PIP_CACHE_DIR="$PROJECT_ROOT/.cache/pip"
python3 -m venv .download-venv
./.download-venv/bin/python -m pip install -U huggingface_hub
./.download-venv/bin/hf --help
```

然后在已经确认仓库的前提下：

```bash
./.download-venv/bin/hf download dgrauet/ltx-2.5-mlx-q4 \
  --local-dir "$PROJECT_ROOT/models/ltx25-q4"
```

这个 LTX 模型下载量较大；请先在 [按设备选择模型](/guide/deploy) 确认内存与磁盘余量。
:::

::: details 进阶：Windows PowerShell 下载 Hugging Face 模型
先在资源管理器中建立专用项目目录，在该目录打开 PowerShell：

```powershell
$PROJECT_ROOT = (Get-Location).Path
$env:HF_HOME = Join-Path $PROJECT_ROOT '.cache\huggingface'
$env:PIP_CACHE_DIR = Join-Path $PROJECT_ROOT '.cache\pip'
py -3 -m venv .download-venv
.\.download-venv\Scripts\python.exe -m pip install -U huggingface_hub
.\.download-venv\Scripts\hf.exe --help
```

下载前还应核对所选模型能否使用 Windows 的目标推理工具。
:::

::: details 进阶：国内镜像、版本锁定和文件校验
**ModelScope** 使用独立模型仓库和下载工具；只有发布了对应权重版本的仓库，才适合用它替代其他来源。

**HF-Mirror** 属于第三方社区镜像。对可公开访问的仓库，在能核对下载文件的条件下，Mac/Linux 可临时指定 `HF_ENDPOINT=https://hf-mirror.com`；但不要将私人访问令牌发送给不可信服务，也不要把镜像配置写入全局环境。

`hf download` 支持 `--revision`。想固定模型版本，可以在官方仓库 Files / History 复制真实 Commit SHA，再按官方帮助添加 `--revision`。本地独立计算 SHA-256 不能证明文件来自官方，只有与可信上游公布的哈希一致才可用作来源校验。

原始操作资料：[Hugging Face 官方下载文档](https://huggingface.co/docs/huggingface_hub/guides/download) · [官方 CLI](https://huggingface.co/docs/huggingface_hub/guides/cli) · [ModelScope](https://modelscope.cn/models)。
:::
