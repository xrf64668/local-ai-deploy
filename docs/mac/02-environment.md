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

## 第二步：由你自己选择项目文件夹

**安装在哪里，完全由你决定。** 不强制使用 `mac-ai-lab`，也不需要填写 `/Users/某个人/...` 之类的固定路径。

建议先在 Finder 中新建一个**专用、尽量空的项目文件夹**（例如叫“我的本地AI”），可放在内置磁盘或外置 SSD。请不要直接选择整个“下载”目录、用户主目录、系统目录，或其他已经部署好模型的文件夹。

### 方式 A · 点击窗口选择（推荐）

打开 Mac 自带的「终端」，复制下面这段**选择目录的命令**：

```bash
PROJECT_ROOT=""
if SELECTED_FOLDER="$(osascript -e 'POSIX path of (choose folder with prompt "请选择专用的 AI 项目文件夹")')" && [ -d "$SELECTED_FOLDER" ]; then
  cd "$SELECTED_FOLDER" &&
  PROJECT_ROOT="$(pwd -P)" &&
  printf '已选择项目目录：%s\n' "$PROJECT_ROOT"
else
  echo "已取消或未找到文件夹，请先选择目录，不要继续安装。"
fi
```

**命令做什么？** `osascript` 调出 macOS 自带的文件夹选择窗口；`PROJECT_ROOT` 用来记住你选的目录；`cd` 进入它。**这一步不会安装软件或创建模型文件。**

**成功标志：** 屏幕会显示 `已选择项目目录：...`，路径就是你自己选的位置。点击“取消”后会提示停止，**不要继续后面的安装命令**。

### 方式 B · 用 Finder 拖拽路径（备用）

不想使用文件夹选择窗口，也可以先在终端输入 `cd `（注意末尾有空格），把 Finder 里的项目文件夹**拖进终端窗口**，然后按回车。接着执行：

```bash
PROJECT_ROOT="$(pwd -P)"
printf '已选择项目目录：%s\n' "$PROJECT_ROOT"
```

这样同样会自动获取路径，包含空格或中文的文件夹名称也不需要手动拼接。

### 创建这个目录专属的 Python 环境

**先确认上一步已显示正确目录。** 下面只会在所选项目目录内创建 `.venv`：

```bash
if [ -z "${PROJECT_ROOT:-}" ] || [ ! -d "$PROJECT_ROOT" ]; then
  echo "尚未选择有效项目文件夹，请完成上一步。"
else
  cd "$PROJECT_ROOT" &&
  python3 -m venv "$PROJECT_ROOT/.venv" &&
  source "$PROJECT_ROOT/.venv/bin/activate" &&
  python -c "import sys; print(sys.executable)"
fi
```

- `venv`：建立只属于该项目的 Python 环境。
- `source`：让当前终端使用它。
- `print(sys.executable)`：显示当前使用的 Python 位置，方便验收。

**成功标志：** 最后一行 Python 路径位于你自己选择的 `项目文件夹/.venv/`，而不是系统目录。如果没有出现该路径，请先排查，不要继续安装依赖。

若所选框架要求特定 Python 版本，应使用对应版本解释器创建环境。**以后新开终端需要重新进入这个目录并激活环境**；项目搬迁后通常需要重建 `.venv`。

## 第三步：把缓存放进你选择的项目

**请继续使用刚才的同一个终端窗口，并确认已经进入项目目录、激活虚拟环境。** 以下缓存文件夹都创建在所选目录下，不依赖项目名称。

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
