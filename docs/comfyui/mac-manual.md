# Mac 手动安装 ComfyUI（进阶：逐条命令）

本页为 **希望完全掌控 Python、模型和缓存目录** 的读者准备。第一次使用 ComfyUI、只想生成图片的读者，建议先完成 [无需命令行的 Mac Desktop 教程](/comfyui/mac)。

> **本篇怎么使用：** 按顺序执行，每个命令框后面都写了作用与成功标志。遇到错误先停止，不要把所有命令整段重复运行。

## 01 · 安装前要准备什么？

- Apple Silicon Mac；在「关于本机」核对芯片与 macOS 版本。
- Git：用来下载 ComfyUI 的程序代码。
- Python：用来运行 ComfyUI。请根据当前 ComfyUI/PyTorch 版本选受支持的 Python（示例以已安装的兼容 `python3` 为前提）。
- 在 Finder 中创建一个你自己命名的**专用项目文件夹**（尽量为空），可放在内置磁盘或外置 SSD。ComfyUI 代码、Python 环境、模型及缓存会以此为安装根目录，不再强制使用 `comfyui-local`。

不认识这些词？查看 [新手术语词典](/comfyui/glossary)。

### 第 1 步：检查 Git

打开「终端」并复制：

```bash
git --version
```

**作用：** 检查是否能使用 Git。**成功标志：** 显示 `git version ...`；如果系统提示安装 Command Line Tools，按系统界面操作后再检查。

### 第 2 步：检查 Python

```bash
python3 --version
```

**作用：** 查看当前 Python 版本。**成功标志：** 显示 `Python x.y.z`。如果不存在或不满足所选 ComfyUI/PyTorch 的要求，请先根据 [Python 官方下载](https://www.python.org/downloads/macos/) 安装兼容版本，不要用系统 Python 随意代替。

### 第 3 步：查看磁盘空间

```bash
df -h .
```

**作用：** 查看当前目录所在磁盘的剩余空间。**成功标志：** 能找到 `Avail`（可用空间）。模型文件可能比 ComfyUI 程序大得多，需预留额外余量。

## 02 · 由你决定 ComfyUI 安装在哪里

你不必在终端输入一个写死的项目路径。**先在 Finder 新建专用文件夹，再从弹出的窗口中选择它。** 也可以选择外置硬盘上的文件夹。

::: warning 选择前请确认
建议使用一个**专用、尽量为空的文件夹**。不要直接选择整个用户主目录、系统目录、已经安装好的其他模型项目目录；本教程会在所选位置创建 `src`、`.venv` 和 `.cache`。
:::

### 方式 A · 弹出 macOS 文件夹选择窗口（推荐）

在「终端」中执行：

```bash
PROJECT_ROOT=""
if SELECTED_FOLDER="$(osascript -e 'POSIX path of (choose folder with prompt "请选择专用的 ComfyUI 项目文件夹")')" && [ -d "$SELECTED_FOLDER" ]; then
  cd "$SELECTED_FOLDER" &&
  PROJECT_ROOT="$(pwd -P)" &&
  printf '已选择项目目录：%s\n' "$PROJECT_ROOT"
else
  echo "已取消或未找到文件夹，请先选择目录，不要继续安装。"
fi
```

**命令做什么？** `osascript` 调用 macOS 自带的文件夹选择窗口；`cd` 进入用户所选目录；`PROJECT_ROOT` 保存该目录的真实路径。**这里只选路径，不会下载或安装文件。**

**成功标志：** 显示 `已选择项目目录：...`。如果取消选择，则不要继续后面的安装命令。

### 方式 B · 直接把 Finder 文件夹拖进终端

在终端输入 `cd `（后面留一个空格），然后从 Finder 把项目文件夹拖进终端，再按回车。接着执行：

```bash
PROJECT_ROOT="$(pwd -P)"
printf '已选择项目目录：%s\n' "$PROJECT_ROOT"
```

**成功标志：** 打印出的路径就是你准备存放 ComfyUI 的文件夹；路径中可以含中文和空格。

### 再检查一次目标目录

```bash
if [ -z "${PROJECT_ROOT:-}" ] || [ ! -d "$PROJECT_ROOT" ]; then
  echo "没有有效的项目目录，请先完成选择。"
else
  printf '准备安装到：%s\n' "$PROJECT_ROOT"
  df -h "$PROJECT_ROOT"
fi
```

**确认后才继续下一步。** 后面相对路径 `src/`、`.venv/`、`.cache/` 都是**相对于你选择的项目文件夹**，而不是固定的 `comfyui-local`。

## 03 · 下载 ComfyUI 程序代码

```bash
git clone https://github.com/Comfy-Org/ComfyUI.git src
```

**含义：** `git clone` 表示从官方 GitHub 仓库复制程序代码；`src` 是你本地的代码文件夹名称。

**成功标志：** 终端出现接收文件和完成的信息，所选项目文件夹下的 `src` 目录存在。网络失败时先检查连接，不要直接改用不明镜像。

## 04 · 创建独立 Python 环境

```bash
python3 -m venv .venv
```

**含义：** 创建一份只属于本项目的 Python 环境，文件保存在 `.venv` 文件夹。它不等于重新安装整个 macOS。

```bash
source .venv/bin/activate
```

**含义：** 激活这份环境。它只对当前终端窗口生效。

```bash
python -c "import sys; print(sys.executable)"
```

**成功标志：** 输出路径指向你选择的 `项目文件夹/.venv/bin/python`，不是系统全局 Python。若失败，暂停检查 Python 版本与 venv 创建日志。

## 05 · 设置项目内缓存

这些设置是为了不把大量模型缓存散落在系统目录。**必须在同一个终端窗口执行**。

```bash
PROJECT_ROOT="$(pwd -P)"
mkdir -p .cache/huggingface .cache/xdg .cache/torch .cache/pip .cache/tmp
export HF_HOME="$PROJECT_ROOT/.cache/huggingface"
export XDG_CACHE_HOME="$PROJECT_ROOT/.cache/xdg"
export TORCH_HOME="$PROJECT_ROOT/.cache/torch"
export PIP_CACHE_DIR="$PROJECT_ROOT/.cache/pip"
export TMPDIR="$PROJECT_ROOT/.cache/tmp/"
export PYTHONNOUSERSITE=1
```

**含义：** `PROJECT_ROOT` 是当前项目目录；`export` 是给后续安装与运行命令指定缓存位置。

**成功标志：** 执行 `echo "$HF_HOME"`，路径在你选定的 `项目文件夹/.cache/` 中。设置变量不会下载任何模型。

::: details 看不懂这些缓存变量怎么办？
- `HF_HOME`：Hugging Face 相关缓存。
- `TORCH_HOME`：PyTorch 常用缓存。
- `PIP_CACHE_DIR`：Python 安装工具 pip 的缓存。
- `XDG_CACHE_HOME`、`TMPDIR`：部分软件使用的缓存与临时目录。

它们的用途是减少对系统全局目录的依赖。不同第三方工具可能仍有自己的保存规则，部署前请核对。
:::

## 06 · 安装推理依赖

先升级当前**项目环境**中的 pip：

```bash
python -m pip install --upgrade pip
```

安装 PyTorch 的 macOS 版本（如上游所选版本对命令有特别要求，以[官方安装说明](https://docs.comfy.org/installation/manual_install)和 [PyTorch 安装选择器](https://pytorch.org/get-started/locally/)为准）：

```bash
python -m pip install torch torchvision torchaudio
```

然后安装 ComfyUI 自己的依赖：

```bash
python -m pip install -r src/requirements.txt
```

**成功标志：** 安装过程结束时没有 `ERROR`，且命令返回终端提示符。若失败，保存完整错误，而不是继续运行。

再检查 Apple Silicon 的 GPU 加速：

```bash
python -c "import torch; print('MPS:', torch.backends.mps.is_available())"
```

**成功标志：** 显示 `MPS: True`。如果显示 `False`，先检查 PyTorch 版本、Apple Silicon 与 macOS 的支持情况，**不要假定已经在 GPU 上运行**。

## 07 · 启动 ComfyUI

```bash
cd src
python main.py --listen 127.0.0.1 --port 8188
```

**含义：** 进入 ComfyUI 源代码目录并启动本地服务。这里的 `127.0.0.1` 表示**只允许本机连接**；`8188` 是服务端口。

**成功标志：** 在 Mac 浏览器打开 [http://127.0.0.1:8188](http://127.0.0.1:8188) 能看到节点画布；终端不持续报错。按 `Ctrl+C` 可停止本次服务。

接下来进入 [第一次生成图片](/comfyui/first-workflow)，真正生成文件再算完成整个安装验证。

## 08 · 下次启动怎么办？

你可以用 Finder 打开项目目录，但**不要依赖移动后的旧虚拟环境直接运行**。项目移动后应优先重建 `.venv`。

如果项目没有移动，先用本页第 02 节的**文件夹选择方式**再次进入你之前创建的项目目录（或者从 Finder 拖动该文件夹到 `cd ` 后按回车），然后执行：

```bash
source .venv/bin/activate
PROJECT_ROOT="$(pwd -P)"
export HF_HOME="$PROJECT_ROOT/.cache/huggingface"
export XDG_CACHE_HOME="$PROJECT_ROOT/.cache/xdg"
export TORCH_HOME="$PROJECT_ROOT/.cache/torch"
export PIP_CACHE_DIR="$PROJECT_ROOT/.cache/pip"
export TMPDIR="$PROJECT_ROOT/.cache/tmp/"
export PYTHONNOUSERSITE=1
cd src
python main.py --listen 127.0.0.1 --port 8188
```

这段用于**下次启动**，不要在首次安装过程中重复执行它。它不会自动更新依赖或重下载模型。

## 09 · 遇到问题

| 错误 | 首先检查 |
| --- | --- |
| `git: command not found` | Git 或 Command Line Tools 是否安装 |
| `python3: command not found` | Python 安装及终端 PATH |
| `No module named torch` | 当前终端是否激活了 `.venv` |
| `MPS: False` | 系统、芯片和 PyTorch 版本 |
| 浏览器连接被拒绝 | `python main.py` 是否仍在运行、端口是否正确 |
| 画布没有模型 | [模型目录与权重说明](/comfyui/models-and-paths) |

官方参考：[ComfyUI 手动安装](https://docs.comfy.org/installation/manual_install)。本页面提供的是教学拆解，具体依赖版本兼容性需以当前上游发布为准。
