# Ubuntu 图像模型：使用 ComfyUI 生成第一张图

<DeploymentSelection />

[← 返回 Linux 配置与目标选择](/ubuntu/)

图像模型建议通过 **ComfyUI + NVIDIA CUDA** 运行。与视频 LTX/Wan、Ollama 聊天是独立环境，不需要全部安装。

## 01 · 先检查 NVIDIA 显卡和驱动

在 Ubuntu 终端执行：

```bash
nvidia-smi
df -h .
```

**成功标志：** 能读取 GPU 型号、驱动与显存。驱动不可用时先排障；安装 PyTorch 不会自动修复坏掉的内核驱动。

## 02 · 在本页完成 ComfyUI 的安装与启动

先确保 Ubuntu 的系统 Git、Python 和虚拟环境组件可用：

```bash
sudo apt update
sudo apt install -y git python3 python3-venv python3-pip
```

**安装目录由你决定。** 在你自己新建的空 ComfyUI 项目目录里打开终端，执行：

```bash
PROJECT_ROOT="$(pwd -P)"
git clone https://github.com/Comfy-Org/ComfyUI.git "$PROJECT_ROOT/src"
python3 -m venv "$PROJECT_ROOT/.venv"
source "$PROJECT_ROOT/.venv/bin/activate"
export HF_HOME="$PROJECT_ROOT/.cache/huggingface"
export XDG_CACHE_HOME="$PROJECT_ROOT/.cache/xdg"
export TORCH_HOME="$PROJECT_ROOT/.cache/torch"
python -m pip install --upgrade pip
```

安装**适合当前 NVIDIA 驱动的 CUDA PyTorch**：先打开 [PyTorch 官方安装选择器](https://pytorch.org/get-started/locally/)，选 Linux / Pip / Python / CUDA，再复制对应指令。以下 **CUDA 12.8 仅作条件示例**，并不适用于所有驱动：

```bash
python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
python -c "import torch; print('CUDA:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A')"
```

**成功标志：** 输出 `CUDA: True` 且 GPU 型号正确。若为 False，停止安装并检查驱动和 PyTorch 构建。

```bash
python -m pip install -r "$PROJECT_ROOT/src/requirements.txt"
cd "$PROJECT_ROOT/src"
python main.py --listen 127.0.0.1 --port 8188
```

桌面 Ubuntu 在本机访问 `http://127.0.0.1:8188`；SSH 远程服务器则从**你自己的电脑**建立 `ssh -L 8188:127.0.0.1:8188 user@your-server` 隧道，并在本地浏览器打开相同地址，不要直接开放公网 8188。

**成功标志：** 画布能打开；这只证明环境启动，下一步才是模型下载和生成。

## 03 · 从工作流确定下载哪些文件

进入 ComfyUI 的基础文生图工作流，记录所需的 Checkpoint、UNet、VAE、文本编码器，再按要求下载。不同模型的组件不能随便混合。

[模型下载来源和目录](/comfyui/models-and-paths) · [国内/国外下载说明](/guide/model-download)

## 04 · 第一次生成

先以工作流默认低分辨率生成一张图片，保存输出文件并打开查看。遇到 CUDA OOM 时应减小分辨率、批量，或选更轻量的工作流。

**成功标志：** 得到可打开的实际图像，而不是只看到节点编辑器。

::: details 进阶：API 和节点调试
模型成功生成后再进入 [ComfyUI HTTP API](/comfyui/api) 和 [常见错误](/comfyui/troubleshooting)，新手不用先处理任务队列和 WebSocket。
:::