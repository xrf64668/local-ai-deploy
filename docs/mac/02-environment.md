# 02 · 在 Mac 上隔离 Python 与模型缓存

**目标：** 每一个推理框架拥有独立环境；项目移动时，可以重新构建环境，不污染别的模型。

::: tip 完全不懂这些命令？先走零命令路线
如果你的目标只是体验 AI 生成图片，建议先用 [Mac ComfyUI Desktop](/comfyui/mac) 完成第一次生成。**本页属于进阶环境管理知识**，不必在第一次运行 ComfyUI 之前全部学会。遇到陌生名词，可查 [新手术语词典](/comfyui/glossary)。
:::

| 名称 | 通俗解释 |
| --- | --- |
| Python | 运行很多 AI 工具的程序语言 |
| venv | 让一个项目使用自己的一套 Python 环境 |
| 缓存 | 下载和安装时保留的临时、可复用文件 |
| PROJECT_ROOT | 当前项目根目录，避免把所有路径写死 |

下面的代码用于理解工程化隔离，不是所有 Mac 用户都必须执行的安装任务。

## 第一步：检查基础工具

**① Git：检查是否安装了下载程序源码的工具。**

```bash
git --version
```

**成功：** 能看到 `git version ...`。

**② Python：检查当前电脑的解释器版本。**

```bash
python3 --version
```

**成功：** 能看到 `Python ...`。如果版本与目标模型依赖不兼容，需要先安装匹配版本。

**③ Apple 命令行工具：检查基础开发工具。**

```bash
xcode-select -p
```

**成功：** 返回已安装开发工具的目录。

如果缺少 Command Line Tools，可以运行 `xcode-select --install` 并按照 macOS 提示完成。Python 版本应该根据实际项目及 PyTorch/MLX 的兼容要求选择，不要直接用系统自带版本赌兼容。

## 第二步：创建独立演示项目

下面每行都只在当前文件夹及其新建的 `mac-ai-lab` 子目录内工作。

- `mkdir`：新建文件夹；`cd`：进入文件夹。
- `venv`：建立项目专属环境；`source`：让当前终端使用它。
- `print(sys.executable)`：显示当前用的是哪个 Python，方便验收。

先进入计划存放模型的磁盘目录，再执行：

```bash
mkdir -p mac-ai-lab
cd mac-ai-lab
PROJECT_ROOT="$(pwd -P)"
python3 -m venv .venv
source .venv/bin/activate
python -c "import sys; print(sys.executable)"
```

**成功标志：** Python 路径位于你的 `mac-ai-lab/.venv/` 下，而不是系统目录。若选定框架要求 Python 3.11 或 3.12，务必先安装对应解释器，再用它创建 venv。

## 第三步：把缓存放进项目

```bash
mkdir -p cache/huggingface cache/pip cache/uv cache/xdg cache/tmp

export HF_HOME="$PROJECT_ROOT/cache/huggingface"
export PIP_CACHE_DIR="$PROJECT_ROOT/cache/pip"
export UV_CACHE_DIR="$PROJECT_ROOT/cache/uv"
export XDG_CACHE_HOME="$PROJECT_ROOT/cache/xdg"
export TMPDIR="$PROJECT_ROOT/cache/tmp/"
export PYTHONNOUSERSITE=1

python -m pip cache dir
```

**成功标志：** pip 缓存路径位于当前项目。Hugging Face 路径必须在导入相关库之前设置，否则可能沿用用户目录中的全局默认缓存。

::: warning 不要直接混用不同模型的 venv
这是一个基础演示目录。正式部署 LTX、Wan 或 ComfyUI 时，请在各自项目中创建独立环境，不要为了修复某个包依赖而升级其他模型的全部依赖。
:::

## 第四步：清理和恢复

退出当前环境：`deactivate`。要重新启动，先回到项目目录并运行 `source .venv/bin/activate`。

虚拟环境在项目搬迁后可能保留旧绝对路径，**重新创建 venv 比直接复制整个 venv 更可靠**。不要删除已经下载和验证成功的模型权重。

下一步：[03 · 推理运行时选择](/mac/03-runtime)。
