# LTX-2.5 MLX Q4：根据你的 Mac 进行本地部署

这是 **Apple Silicon + MLX** 的视频模型安装教程，不以某一台 M4/32GB 机器的个人测试记录作为所有访客的硬件结论。

先在 [Mac 04 · 选择模型](/mac/04-models) 填写**你自己的统一内存与磁盘剩余空间**。如果没有达到上游参考起点，请先查看更小的 LTX-2.3 Q4 或其他模型路线。

## 01 · 先核对上游文件与限制

| 项目 | 本教程使用 |
| --- | --- |
| 上游推理工具 | [dgrauet/ltx-2-mlx](https://github.com/dgrauet/ltx-2-mlx) |
| MLX 权重仓库 | [dgrauet/ltx-2.5-mlx-q4](https://huggingface.co/dgrauet/ltx-2.5-mlx-q4) |
| 权重下载量 | 约 47GB，模型文件清单以官方仓库为准 |
| 模型结构 | dev、distilled、文本编码器、VAE 等多文件 |
| 参考内存 | 参考上游的低内存选项与具体权重；不保证任意分辨率可运行 |
| Python | 满足上游要求的 Python 3.11+ |
| 视频输出 | 需要 ffmpeg，检查输出可用 ffprobe |

模型许可证遵循上游转换权重的相关许可，下载前打开模型仓库核对访问权限和具体限制。<span></span>

## 02 · 由你选择独立项目目录

先在 Finder 建立一个**空的 LTX 项目文件夹**，然后在 Mac 终端中执行：

```bash
PROJECT_ROOT=""
if CHOSEN="$(osascript -e 'POSIX path of (choose folder with prompt "选择 LTX 项目文件夹")')" && [ -d "$CHOSEN" ]; then
  cd "$CHOSEN" && PROJECT_ROOT="$(pwd -P)"
fi
[ -n "$PROJECT_ROOT" ] || { echo "未选择目录，请停止"; false; }
printf '当前项目：%s\n' "$PROJECT_ROOT"
```

**验收：** 输出刚才选择的路径。如果取消选择，不要继续下方步骤。下面命令必须在**同一个终端会话**执行。

先确认设备条件：

```bash
uname -m
python3 --version
git --version
ffmpeg -version
df -h "$PROJECT_ROOT"
```

若缺少 Python、Git 或 ffmpeg，请先按对应工具官方安装说明完成，不要将不兼容的解释器直接用于创建环境。

## 03 · 创建下载环境与项目内缓存

```bash
mkdir -p "$PROJECT_ROOT/models" "$PROJECT_ROOT/outputs" "$PROJECT_ROOT/.cache/huggingface" "$PROJECT_ROOT/.cache/pip" "$PROJECT_ROOT/.cache/uv"
export HF_HOME="$PROJECT_ROOT/.cache/huggingface"
export PIP_CACHE_DIR="$PROJECT_ROOT/.cache/pip"
export UV_CACHE_DIR="$PROJECT_ROOT/.cache/uv"
export UV_PYTHON_INSTALL_DIR="$PROJECT_ROOT/.cache/uv/python"
export UV_PYTHON_DOWNLOADS=never
python3 -m venv "$PROJECT_ROOT/.tools"
"$PROJECT_ROOT/.tools/bin/python" -m pip install -U pip uv huggingface_hub
"$PROJECT_ROOT/.tools/bin/hf" --help
```

**验收：** `hf --help` 出现帮助，且 `.tools` 位于你选择的项目目录。

## 04 · 下载模型（国外 / 国内）

**首选官方 Hugging Face 仓库：**

```bash
"$PROJECT_ROOT/.tools/bin/hf" download dgrauet/ltx-2.5-mlx-q4 \
  --local-dir "$PROJECT_ROOT/models/ltx25-q4"
```

如模型仓库要求许可确认或登录，请先在上游页面办理，再通过 `hf auth login` 登录。国内网络若无法访问官方服务，可按网络条件使用**科学上网**。公开模型可选第三方 HF 镜像，需独立核对来源和文件大小；更多见 [国内外模型下载方法](/guide/model-download)。

**检查下载完整性：**

```bash
du -sh "$PROJECT_ROOT/models/ltx25-q4"
ls -lh "$PROJECT_ROOT/models/ltx25-q4"
```

不仅要有 transformer，还要核对 text encoder、VAE 和配置。只有本机计算出的 SHA 并不能证明文件来自官方。

## 05 · 安装对应 MLX 运行时

```bash
git clone https://github.com/dgrauet/ltx-2-mlx.git "$PROJECT_ROOT/src"
cd "$PROJECT_ROOT/src"
git rev-parse HEAD
"$PROJECT_ROOT/.tools/bin/uv" sync --all-extras
"$PROJECT_ROOT/.tools/bin/uv" run ltx-2-mlx generate --help
```

**验收：** 依赖同步和 CLI 帮助成功；出现错误时，核对 Python 和上游提交版本，不要拿 Wan 或 ComfyUI 的环境覆盖 LTX 依赖。

## 06 · 尝试第一个低负载视频

当前命令格式依据上游 **ltx-2-mlx** 的 `generate` CLI：

```bash
cd "$PROJECT_ROOT/src"
"$PROJECT_ROOT/.tools/bin/uv" run ltx-2-mlx generate \
  --distilled --low-ram \
  --model "$PROJECT_ROOT/models/ltx25-q4" \
  --prompt "A small paper boat drifting on a calm lake" \
  -H 320 -W 512 -f 25 --frame-rate 24 \
  -o "$PROJECT_ROOT/outputs/ltx-first.mp4"
```

512×320、25 帧只是首次验证的**轻负载参数**，不代表在用户当前电脑上一定成功。低内存选项也可能使推理更慢。

## 07 · 验证输出，不以下载完成为成功

```bash
ls -lh "$PROJECT_ROOT/outputs/ltx-first.mp4"
ffprobe -v error -show_entries format=duration,size -of json "$PROJECT_ROOT/outputs/ltx-first.mp4"
```

如果输出不存在或 ffprobe 报错，应记录实际系统、内存压力、代码提交、模型 revision、分辨率及帧数再排查。

**本页状态：已核对上游下载仓库与命令接口，未对每一种 Mac 与权重组合实机验证。**

[按照自己的 Mac 配置重新选择](/mac/04-models) · [05 · 验证生成](/mac/05-verify) · [07 · API 方案](/mac/07-api)

参考：[上游安装及 CLI](https://github.com/dgrauet/ltx-2-mlx) · [Q4 文件与许可证](https://huggingface.co/dgrauet/ltx-2.5-mlx-q4)。
