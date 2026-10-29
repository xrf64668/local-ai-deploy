# Mac LTX-2.3 MLX Q4：较轻的视频模型路线

**适合谁：** 想在 Apple Silicon 上尝试视频模型，但统一内存或磁盘不足以优先尝试 LTX-2.5 的读者。LTX-2.3 与 LTX-2.5 是不同版本，不能直接混用模型权重。

[← 返回 Mac 视频选型](/mac/video) · [按 Mac 配置判断](/mac/)

## 01 · 先确认自己的硬件

在「苹果菜单 → 关于本机」查看统一内存和芯片，在系统储存空间检查剩余空间。上游的 Q4 int4 路线允许在约 16GB Apple Silicon 上尝试，但**不保证任何 16GB 电脑都能跑完**。先保留充足的磁盘余量和系统内存，不运行其他大型任务。

## 02 · 从可信模型仓库找到正确版本

| 项目 | 本教程选择 |
| --- | --- |
| 运行框架 | [dgrauet/ltx-2-mlx](https://github.com/dgrauet/ltx-2-mlx) |
| MLX 量化模型 | [dgrauet/ltx-2.3-mlx-q4](https://huggingface.co/dgrauet/ltx-2.3-mlx-q4) |
| 预计下载量 | 约 12GB，真实体积以仓库 Files 为准 |
| 第一次任务 | 低分辨率、25 帧短片 |
| 测试状态 | 上游的低内存参考条件；不是本站对全部 Mac 的实测 |

## 03 · 自己选择一个专用项目目录

先在 Finder 创建一个空的 LTX-2.3 文件夹，在该文件夹打开终端，然后执行：

```bash
PROJECT_ROOT="$(pwd -P)"
uname -m
python3 --version
git --version
ffmpeg -version
df -h "$PROJECT_ROOT"
```

**成功标志：** 能查看到 `arm64`、兼容的 Python 3.11+、Git、FFmpeg 与足够磁盘。没有兼容工具时先停止，不要直接安装到系统 Python。

## 04 · 在项目内创建独立环境

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

**成功标志：** `hf --help` 出现命令说明，下载工具位于自己选的目录。

## 05 · 下载模型（国外和国内）

先打开 [LTX-2.3 Q4 模型文件列表](https://huggingface.co/dgrauet/ltx-2.3-mlx-q4/tree/main)，检查许可证、文件及版本。可以直连时执行：

```bash
"$PROJECT_ROOT/.tools/bin/hf" download dgrauet/ltx-2.3-mlx-q4 \
  --local-dir "$PROJECT_ROOT/models/ltx23-q4"
```

国内网络不能访问原仓库时，可根据网络条件使用**科学上网**。也可以在理解镜像风险后尝试公开模型的第三方镜像，但不应把私密访问令牌交给第三方。[国内外下载完整说明](/guide/model-download)。

```bash
ls -lh "$PROJECT_ROOT/models/ltx23-q4"
du -sh "$PROJECT_ROOT/models/ltx23-q4"
```

**成功标志：** 文件与仓库列表一致，不能只看到几个 KB 的配置文件就认为完成下载。

## 06 · 安装 LTX-2.3 对应的 MLX 运行时

```bash
git clone https://github.com/dgrauet/ltx-2-mlx.git "$PROJECT_ROOT/src"
cd "$PROJECT_ROOT/src"
git rev-parse HEAD
"$PROJECT_ROOT/.tools/bin/uv" sync --all-extras
"$PROJECT_ROOT/.tools/bin/uv" run --no-sync ltx-2-mlx generate --help
```

**成功标志：** 同步成功，`generate --help` 能打印参数。请记录 Git Commit；后端版本变化可能改变命令。

## 07 · 生成第一个短视频

LTX-2.3 **必须显式指定帧数**，不像部分 LTX-2.5 路线允许自动预测时长。先用轻负载参数：

```bash
cd "$PROJECT_ROOT/src"
"$PROJECT_ROOT/.tools/bin/uv" run --no-sync ltx-2-mlx generate \
  --distilled --low-ram \
  --model "$PROJECT_ROOT/models/ltx23-q4" \
  --prompt "A paper boat drifting on a calm lake" \
  -H 320 -W 512 -f 25 --frame-rate 24 \
  -o "$PROJECT_ROOT/outputs/ltx23-first.mp4"
```

**验收：** 生成过程结束，确实产生文件。低负载参数只是首次实验起点，失败时按机器实际日志处理。

```bash
ffprobe -v error -show_entries format=duration,size -of json "$PROJECT_ROOT/outputs/ltx23-first.mp4"
```

**真正的成功：** MP4 可播放，`ffprobe` 能解析时长。不能因为模型下载完成或 CLI 打印帮助就判定已部署成功。

[返回 Mac 视频模型比较](/mac/video) · [LTX-2.5 更大模型路线](/mac/models/ltx25) · [常见错误](/mac/troubleshooting)

参考：[上游 README 与 CLI](https://github.com/dgrauet/ltx-2-mlx) · [LTX-2.3 Q4 权重](https://huggingface.co/dgrauet/ltx-2.3-mlx-q4)。