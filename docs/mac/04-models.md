# 04 · 按自己的 Mac 配置选择并下载模型

**本阶段目标：** 先选择你当前使用的 Mac、统一内存和可用磁盘，再选择具体模型和下载网络。下方会显示**与这次访客选择对应的命令**；不沿用别人使用过的 M4/32GB 配置。

如果还不知道该搜索什么，可以先阅读 [三分钟找模型与下载入门](/guide/model-download)，或者去 [搜索模型发布仓库](/guide/model-search)。这一步只需要弄清：**我的电脑是什么、想生成什么、准备下载哪个版本**。

## 第一步 · 选择硬件、模型与下载渠道

<ModelDownloadPlanner initialPlatform="mac" />

## 第二步 · 看下载结果，按要求开始安装

在上面的选择器中确定模型以后，点击下载命令下方的**具体模型教程**。所有命令必须在使用者自己选定的模型项目目录中执行。第一次下载后要完成模型文件检查和真实生成测试。

不必为了下载一个视频模型而先学会全部 Git、revision 或 API 原理。下面的示例仅用于对照；对应模型的独立环境、权重组成及真实运行命令，应以专项教程为准。

::: details 展开：Mac 常见模型的下载命令对照（进阶）

以下命令是独立示例；上方生成器会依据你选择的模型确定实际仓库。

### A · Ollama 官方模型库（文字和代码）

先按 [Mac 安装 Ollama](/mac/models/ollama) 完成软件安装。例如下载 Qwen3.8-27B：

```bash
ollama pull qwen3.8:27b
ollama list
ollama run qwen3.8:27b
```

Ollama 会管理自己的模型文件；**HF_ENDPOINT 不适用于 `ollama pull`**。用户应先核对本机内存预算和模型的许可证。

### B · Hugging Face 的 LTX-2.5 MLX Q4（视频）

在专门的模型项目目录下安装好 `huggingface_hub`、设置该目录自己的 `HF_HOME` 后：

```bash
hf download dgrauet/ltx-2.5-mlx-q4 \
  --local-dir "$PROJECT_ROOT/models/ltx25-q4"
```

完整的“选文件夹、安装依赖、下载、生成 MP4”请查看 [LTX-2.5 详细教程](/mac/models/ltx25)。此模型包大约 47GB，需额外准备缓存和输出空间。

### C · Hugging Face 的 Wan2.2 TI2V-5B MLX Q8（视频）

```bash
hf download Anes1032/Wan2.2-TI2V-5B-mlx-q8 \
  --local-dir "$PROJECT_ROOT/models/wan22-q8"
```

完整的运行时、文件校验和生成流程见 [Wan2.2 Q8 教程](/mac/models/wan22)。其模型包约 19.6GB，包含 T5 编码器和 VAE，不能只下载主模型。

上面两个 `$PROJECT_ROOT` 均来自用户自己选择的专用项目目录，**请先执行对应教程中的目录选择与下载器准备步骤**，不能只复制单条含变量的下载命令。

:::

## 第三步 · 国内网络与国外网络

官方源可用时直接使用；如访问受限，可根据网络条件通过**科学上网**访问原始仓库。对于公开仓库，可以审慎尝试第三方 HF 镜像的 `HF_ENDPOINT`，但这并不代表上游授权或文件完整性自动得到保证。是否能从 ModelScope 下载，必须先核对完全一致的仓库和文件格式。

[国内外下载完整说明](/guide/model-download) · [搜索官方模型](/guide/model-search)

## 第四步 · 下载后检查

核对模型发布仓库 Files 列表、Git revision、实际文件大小、`config.json`、tokenizer、VAE 和文本编码器；再进入运行时检查和最小任务。

**下载完成 ≠ 能加载 ≠ 生成成功。**

[05 · 验证真实生成](/mac/05-verify) · [返回 Mac 入口](/mac/)
