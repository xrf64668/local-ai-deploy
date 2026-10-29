# Mac 安装 ComfyUI：从零到第一次生成

适用于 **Apple Silicon（M1 / M2 / M3 / M4 / M5 系列）**。本教程分别提供新手优先的 **Desktop 图形安装**、适合开发者的 **手动隔离安装**。

> 本页属于步骤指南，并非实测性能榜单。Mac 的 ComfyUI 主要使用 PyTorch **MPS**；这和其他项目使用的 **MLX** 不是同一套推理运行时。

## 01 · 安装前检查

打开「终端」，依次复制：

```bash
uname -m
sw_vers -productVersion
sysctl -n hw.memsize | awk '{printf "统一内存约 %.0f GiB\n", $1/1073741824}'
df -h .
```

**通过标准：** 第一条输出 `arm64`，确认是 Apple Silicon；磁盘留足程序、Python 依赖和模型权重空间。若是 `x86_64`，不要直接套用这里的 Apple Silicon 步骤。

| 需要什么 | 如何确认 | 不满足怎么办 |
| --- | --- | --- |
| Apple Silicon | `uname -m` 为 `arm64` | Intel Mac 请查询 [ComfyUI 官方文档](https://docs.comfy.org/installation/manual_install) |
| 合适的 macOS | `sw_vers -productVersion` | 根据所下载 Desktop 版本的最低要求决定是否升级 |
| 可用空间 | `df -h .` | 模型通常比程序大；清理或选择合适的项目磁盘 |
| 对应工作流的内存 | 查看统一内存和模型要求 | 先从低分辨率图像模型开始，不直接挑战重型视频模型 |

## 02 · 路线 A：Desktop 图形安装（新手推荐）

1. 打开 [ComfyUI 官方下载页](https://www.comfy.org/download)，点击 **Install from GitHub**，选择适合当前 macOS 的 Desktop 安装包。
2. 按发布页面指引安装并首次启动。遇到 macOS 安全确认时，只确认自己从官方来源下载的安装包。
3. 首次启动时选择**专门的模型与数据存储目录**；不要误选已有的 `CUSTOM_DEPLOY` 模型目录进行覆盖。
4. 根据应用提示完成依赖准备；完成后进入 ComfyUI 节点画布。

**通过标准：** Desktop 能启动、画布能打开、设置/日志中没有致命安装错误。

Desktop 的目录、启动方式与更新机制和本页后面的手动方案不同，**不要把两种方式的命令混着执行**。

## 03 · 路线 B：手动隔离安装（适合希望控制环境的人）

需要：Git、可用的 **Python 3.11 或 3.12** 以及 Apple Command Line Tools。先检查：

```bash
git --version
python3 --version
xcode-select -p
```

如果未安装命令行工具，可以执行 `xcode-select --install` 并按系统提示完成。若 `python3` 版本不符合所选 PyTorch 兼容范围，请先安装兼容版本，不要硬套系统自带 Python。

在你打算存放项目的目录下执行下面的整段命令；**所有项目代码、venv、模型和缓存都留在新建的 `comfyui-local` 文件夹中**：

```bash
mkdir -p comfyui-local
cd comfyui-local
PROJECT_ROOT="$(pwd -P)"

git clone https://github.com/Comfy-Org/ComfyUI.git src
python3 -m venv .venv
source .venv/bin/activate

export HF_HOME="$PROJECT_ROOT/.cache/huggingface"
export XDG_CACHE_HOME="$PROJECT_ROOT/.cache/xdg"
export TORCH_HOME="$PROJECT_ROOT/.cache/torch"

python -m pip install --upgrade pip
python -m pip install torch torchvision torchaudio
python -m pip install -r src/requirements.txt

python -c "import torch; print('PyTorch:', torch.__version__); print('MPS:', torch.backends.mps.is_available())"
```

**通过标准：** 最后一条命令输出 `MPS: True`。若为 `False`，应先检查 macOS / PyTorch 安装与设备支持，不要将 CPU 运行误判为 Metal 加速成功。

在同一个终端继续启动：

```bash
cd "$PROJECT_ROOT/src"
python main.py --listen 127.0.0.1 --port 8188
```

另开一个终端验证：

```bash
curl -f http://127.0.0.1:8188/system_stats
```

**通过标准：** 浏览器能打开 `http://127.0.0.1:8188`，且上述命令返回 JSON。停止服务时在运行窗口按 `Ctrl+C`。

::: tip 下次如何启动？
进入你的 `comfyui-local` 目录，执行 `source .venv/bin/activate`，重新设置 `PROJECT_ROOT` 及 `HF_HOME`、`XDG_CACHE_HOME`、`TORCH_HOME`，再 `cd src && python main.py --listen 127.0.0.1 --port 8188`。缓存路径的设置要和第一次一致。
:::

## 04 · 下载模型并生成第一张图片

1. 从 ComfyUI 内置的工作流模板中选一个**基础文生图**工作流，记录模板所需的模型名称。
2. 通过模板说明或模型发布者的页面下载匹配的完整权重及必要组件。检查模型许可证与文件大小。
3. 手动安装时，将权重放到 `src/models/checkpoints/`、`src/models/vae/`、`src/models/text_encoders/` 或其他工作流指定目录；Desktop 按应用显示的模型目录操作。
4. 在工作流中选择实际存在的模型，先使用低分辨率、单张图片、较小批量。
5. 点击 Queue / Run（界面版本不同，按钮名称可能略有差异），等待执行完成。

**通过标准：** 工作流执行无红色错误节点，输出目录里出现可以打开的图片。仅打开画布不算首次推理成功。

## 05 · API 与故障排查

手动安装的默认教学地址是 `127.0.0.1:8188`：

```bash
curl -f http://127.0.0.1:8188/system_stats
curl -f http://127.0.0.1:8188/queue
```

要提交工作流，请阅读 [ComfyUI API 完整示例](/comfyui/api)。Desktop 应以实际开放的本地 API 地址为准，不能假定一定是 8188。

| 症状 | 优先排查 |
| --- | --- |
| `MPS: False` | 是否为 arm64、PyTorch 是否正确安装、macOS / GPU 是否支持 |
| `ModuleNotFoundError` | 是否激活了本项目 `.venv`、依赖是否装进该环境 |
| `model not found` | 权重文件是否放在当前 ComfyUI 使用的模型目录，工作流引用是否匹配 |
| 内存不足或卡死 | 降低分辨率、帧数和批量，关闭其他占用内存的应用 |
| 8188 端口占用 | 关闭其他实例，或在启动时使用 `--port 8189` 并同步修改验证地址 |

**提醒：** 不要直接把未加鉴权的 ComfyUI 接口暴露到公网。

参考：[官方手动安装](https://docs.comfy.org/installation/manual_install) · [ComfyUI GitHub](https://github.com/Comfy-Org/ComfyUI)
