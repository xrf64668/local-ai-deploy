# Windows + NVIDIA 安装 ComfyUI

适合第一次在 Windows 电脑上使用 ComfyUI 的用户。**建议先走官方 Desktop 安装**；需要完全控制模型目录、Python 或插件依赖，再选择手动安装。

## 01 · 检查你的电脑

1. 打开「设置 → 系统 → 关于」，查看 Windows 版本与内存。
2. 打开「任务管理器 → 性能 → GPU」查看 NVIDIA 型号及专用显存。
3. 打开 PowerShell，执行：

```powershell
nvidia-smi
Get-PSDrive -PSProvider FileSystem
```

**通过标准：** 第一条能够展示 NVIDIA GPU 与驱动；第二条能看到计划安装的磁盘剩余空间。若 `nvidia-smi` 无法执行，请先检查驱动是否正确安装。

## 02 · 路线 A：Desktop 图形安装（新手优先）

1. 前往 [ComfyUI 官方下载页](https://www.comfy.org/download)，通过官方安装入口进入对应发布页面。
2. 根据页面选择 Windows 适用的 Desktop 安装包，安装并首次启动。
3. 选择模型/数据保存位置时，优先选择空间充足的磁盘；记录位置，后面找权重文件时会用到。
4. 等待依赖安装完成，确认节点画布可以打开。

**通过标准：** ComfyUI Desktop 能正常启动，画布和工作流模板可见，日志没有致命错误。

注意：Desktop、便携版、手动安装版的模型与环境目录**并不一定相同**，后续只按照自己选用的路线操作。

## 03 · 路线 B：手动安装（PowerShell）

提前准备 [Git](https://git-scm.com/download/win)、兼容版本的 [Python](https://www.python.org/downloads/windows/)（本例建议 3.11）和可正常工作的 NVIDIA 驱动。安装 Python 时保证 `py` 启动器可用。

在目标磁盘/项目父目录打开 PowerShell，依次执行：

```powershell
git --version
py -3.11 --version

New-Item -ItemType Directory -Force .\comfyui-local | Out-Null
Set-Location .\comfyui-local
$ProjectRoot = (Get-Location).Path

git clone https://github.com/Comfy-Org/ComfyUI.git src
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1

$env:HF_HOME = Join-Path $ProjectRoot ".cache\huggingface"
$env:TORCH_HOME = Join-Path $ProjectRoot ".cache\torch"
$env:XDG_CACHE_HOME = Join-Path $ProjectRoot ".cache\xdg"

python -m pip install --upgrade pip
```

**通过标准：** PowerShell 行首一般出现 `(.venv)`，执行 `python -c "import sys;print(sys.executable)"` 显示当前项目的 `.venv` 路径。

::: tip PowerShell 拒绝执行 Activate.ps1？
可以仅在**当前 PowerShell 进程**执行 `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`，然后重新激活虚拟环境。不要为了安装 ComfyUI 随意放宽整个系统的执行策略。
:::

## 04 · CUDA PyTorch 与 ComfyUI 依赖

根据 [PyTorch 官方安装选择器](https://pytorch.org/get-started/locally/) 选择 Windows / Pip / Python / CUDA，先核对驱动是否满足所选 CUDA wheel 的要求。

下面是 **CUDA 12.8 的示例**，并非所有驱动的通用选项：

```powershell
python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
python -c "import torch;print('CUDA:',torch.cuda.is_available());print('GPU:',torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A')"
```

**通过标准：** `CUDA: True`。失败时应先查驱动和 PyTorch，不要继续安装模型来碰运气。

```powershell
python -m pip install -r .\src\requirements.txt

Set-Location .\src
python main.py --listen 127.0.0.1 --port 8188
```

在浏览器访问 `http://127.0.0.1:8188`；另一个 PowerShell 窗口执行：

```powershell
curl.exe -f http://127.0.0.1:8188/system_stats
```

**通过标准：** 浏览器显示节点编辑器，接口返回 JSON。

## 05 · 模型目录与首次生成

- Desktop：以首次安装时选择的模型文件夹为准。
- 手动安装：在项目的 `src\models\` 下按工作流要求选择 `checkpoints`、`vae`、`loras`、`text_encoders` 等目录。
- 先使用官方或模型发布方的基础工作流模板，再下载匹配的权重；不要只下载一个不完整组件就尝试运行。
- 先设置低分辨率、单张图片；真正输出可打开的文件，才算完成首次推理。

## 06 · 常见报错

| 现象 | 如何处理 |
| --- | --- |
| `py -3.11` 不存在 | 安装对应 Python 版本，重新打开 PowerShell |
| `Activate.ps1 cannot be loaded` | 按上方提示仅为当前进程允许脚本 |
| `CUDA: False` | 驱动版本、CUDA wheel、GPU 兼容性 |
| `No module named ...` | 检查是否使用本项目虚拟环境 |
| 模型下拉列表没有文件 | 检查实际模型目录、文件名与是否需要刷新或重启 |
| 显存不足 | 减小图片尺寸、批量，选择更小的模型 |

下一步：[ComfyUI API](/comfyui/api) · [ComfyUI 官方手动安装](https://docs.comfy.org/installation/manual_install)
