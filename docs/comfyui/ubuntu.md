# Ubuntu + NVIDIA 安装 ComfyUI

适合 Ubuntu 桌面和独立 NVIDIA GPU 服务器。这里优先使用**项目内 Python 虚拟环境**，不更改系统驱动，也不默认开放公网端口。

## 01 · 环境检查（先做，再安装）

```bash
cat /etc/os-release
uname -m
nvidia-smi
python3 --version
git --version
df -h .
```

**通过标准：** `nvidia-smi` 能展示实际 NVIDIA GPU、驱动版本及显存，不应出现 `Failed to initialize NVML` 或 `No devices were found`。Python、Git 可用，磁盘有安装空间。

::: warning 显卡检查不过，先不要继续
如果 `nvidia-smi` 无法读取 GPU，应先根据 Ubuntu 版本、显卡型号及驱动日志修复驱动。PyTorch CUDA wheel 自带其所需的 CUDA 运行时组件，通常不要求为 ComfyUI 另装系统级 CUDA Toolkit；不要在未知驱动状态下盲目升级。
:::

## 02 · 安装必要系统工具

适用于常见 Ubuntu 桌面/服务器镜像：

```bash
sudo apt update
sudo apt install -y git python3 python3-venv python3-pip
python3 -m venv --help >/dev/null
```

**通过标准：** 最后一条没有报错。若操作系统的默认 Python 版本太新或太旧，请换成与目标 PyTorch、ComfyUI 兼容的 Python 解释器。

## 03 · 创建独立项目与虚拟环境

先进入你想存放项目的磁盘目录，再执行：

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
```

**通过标准：** `which python` 指向当前 `comfyui-local/.venv/bin/python`，而非系统级 Python。

## 04 · 安装适配驱动的 PyTorch CUDA

**先在 [PyTorch 官方安装选择器](https://pytorch.org/get-started/locally/) 按 Linux / Pip / Python / CUDA 选择兼容当前驱动的构建，再复制其命令。**

例如，对于驱动满足相应 CUDA 运行时要求的 NVIDIA 机器，可以使用下面的 **CUDA 12.8 wheel 示例**（不是所有显卡与驱动的通用命令）：

```bash
python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
```

接着立即检查：

```bash
python -c "import torch; print('torch:',torch.__version__); print('CUDA:',torch.cuda.is_available()); print('GPU:',torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A')"
```

**通过标准：** `CUDA: True` 且 GPU 名称与你的机器一致。若为 `False`，暂停排查驱动、PyTorch wheel、GPU 架构；不要继续假装已经启用 GPU。

再安装 ComfyUI：

```bash
python -m pip install -r "$PROJECT_ROOT/src/requirements.txt"
```

## 05 · 启动与 SSH 安全访问

在当前服务器终端启动：

```bash
cd "$PROJECT_ROOT/src"
python main.py --listen 127.0.0.1 --port 8188
```

**本机运行**：浏览器访问 `http://127.0.0.1:8188`；另开终端用 `curl -f http://127.0.0.1:8188/system_stats` 验证 JSON。

**SSH 远程服务器**：在你自己的电脑上新开终端建立隧道（替换账号和主机）：

```bash
ssh -L 8188:127.0.0.1:8188 user@your-server
```

然后在**你自己的电脑**访问 `http://127.0.0.1:8188`。这不要求 ComfyUI 监听 `0.0.0.0`，也不需要对公网开放 8188 端口。

## 06 · 安装模型与第一次生成

1. 在内置模板中选择一个符合当前显存的基础文生图工作流，阅读模板列出的模型组件。
2. 按发布方的要求获取模型并确认许可证；权重文件通常占用数 GB 或更多空间。
3. 手动安装的模型目录位于 `$PROJECT_ROOT/src/models/`，常见子目录为 `checkpoints/`、`loras/`、`vae/` 和 `text_encoders/`。
4. 先尝试单张低分辨率图片，再逐步提升参数；同时通过 `nvidia-smi` 观察显存。
5. **必须生成并打开输出文件**，才算该模型验证通过。

## 07 · 常见问题

| 报错/现象 | 排查 |
| --- | --- |
| `nvidia-smi` 报错 | 驱动与内核模块、Secure Boot、GPU 状态；先修复再安装 |
| `CUDA: False` | 安装错 CPU wheel、驱动过旧、GPU 架构不兼容 |
| `CUDA out of memory` | 降低图像尺寸、批量、模型精度；检查剩余显存 |
| SSH 本地端口冲突 | 改用 `ssh -L 8189:127.0.0.1:8188 ...` 并访问本机 8189 |
| 无法加载节点 | 查看终端中导入失败的模块与完整错误，确认插件与当前版本兼容 |

下一步：[ComfyUI API 示例](/comfyui/api) · [官方手动安装说明](https://docs.comfy.org/installation/manual_install)
