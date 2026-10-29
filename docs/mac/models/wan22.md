# Mac 部署 Wan2.2 TI2V-5B：MLX Q8 下载与生成

<DeploymentSelection />

**适合：** 熟悉基础安装、希望在 Apple Silicon 上探索文字/图片生成视频的读者。本页为可验证的上游方案，**32GB 统一内存是实验起点，不承诺稳定完成**；模型发布方报告了 64GB Apple Silicon 的实际生成记录。

## 01 · 先确认你下载的是哪个模型

| 项目 | 对应版本 |
| --- | --- |
| 原始模型 | [Wan-AI/Wan2.2-TI2V-5B](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B)（原版 PyTorch） |
| 本页的 MLX 转换权重 | [Anes1032/Wan2.2-TI2V-5B-mlx-q8](https://huggingface.co/Anes1032/Wan2.2-TI2V-5B-mlx-q8) |
| 运行工具 | [Blaizzy/mlx-video](https://github.com/Blaizzy/mlx-video) |
| 下载量级 | 上游模型包约 **19.6GB** |
| 关键文件 | `model.safetensors`、`t5_encoder.safetensors`、`vae.safetensors`、`config.json` |
| 推理规则 | 宽高通常需为 32 的倍数，帧数满足 `4n+1` |

原版 PyTorch 和本页的 MLX Q8 不是同一个仓库。**只下载 `model.safetensors` 不够**，文本编码器、VAE 与配置也需要对应版本。

## 02 · 在 Finder 中选择 Wan 项目文件夹

先新建一个专门存放 Wan 的空文件夹。在「终端」执行：

~~~bash
PROJECT_ROOT=""
if CHOSEN="$(osascript -e 'POSIX path of (choose folder with prompt "选择 Wan 项目文件夹")')" && [ -d "$CHOSEN" ]; then
  cd "$CHOSEN" && PROJECT_ROOT="$(pwd -P)"
  printf '当前项目目录：%s\n' "$PROJECT_ROOT"
else
  echo "没有选择目录，请先完成选择。"
fi
~~~

**成功标志：** 终端显示你选择的完整目录。后续命令沿用同一个终端，不要取消选择后继续操作。

检查硬件和基础工具：

~~~bash
uname -m
python3 --version
git --version
df -h "$PROJECT_ROOT"
~~~

**成功标志：** Apple Silicon、兼容的 Python 3.11+、Git 可用，磁盘空间足以保存权重、缓存和输出。不要与现有 LTX 或 ComfyUI 的 Python 环境混用。

## 03 · 建立独立环境

~~~bash
mkdir -p "$PROJECT_ROOT/models" "$PROJECT_ROOT/outputs" "$PROJECT_ROOT/.cache/huggingface" "$PROJECT_ROOT/.cache/pip"
export HF_HOME="$PROJECT_ROOT/.cache/huggingface"
export PIP_CACHE_DIR="$PROJECT_ROOT/.cache/pip"
export XDG_CACHE_HOME="$PROJECT_ROOT/.cache"
python3 -m venv "$PROJECT_ROOT/.venv"
source "$PROJECT_ROOT/.venv/bin/activate"
python -m pip install -U pip huggingface_hub
hf --help
~~~

**成功标志：** `hf --help` 正常显示。现在的依赖只安装在 Wan 项目的 `.venv`。

## 04 · 下载 Wan MLX Q8 权重

### 国外网络：官方模型仓库

打开[模型页面](https://huggingface.co/Anes1032/Wan2.2-TI2V-5B-mlx-q8)确认许可证、文件列表和当前模型 revision，然后执行：

~~~bash
hf download Anes1032/Wan2.2-TI2V-5B-mlx-q8 \
  --local-dir "$PROJECT_ROOT/models/wan22-q8"
~~~

可在命令中加入从模型历史页复制的真实 `--revision` SHA 锁定版本。

### 国内网络：按来源优先级选择

1. 能访问官方 Hugging Face：继续用上面的命令。
2. 官方源受限：根据当地网络条件使用**科学上网**访问官方仓库。
3. 可使用第三方 HF 镜像测试下载，但应确认文件清单、SHA 与权限条件；不要将受限模型 token 随意交给第三方站点。
4. ModelScope 上只有在**确实存在同一 MLX Q8 转换仓库**、组件和许可证匹配时，才可以替换下载来源。不能把同名原版 PyTorch 权重直接使用。

详见 [国内与国外的模型下载方法](/guide/model-download)。

### 检查文件是否齐全

~~~bash
ls -lh "$PROJECT_ROOT/models/wan22-q8/"
du -sh "$PROJECT_ROOT/models/wan22-q8/"
~~~

**成功标志：** 除了配置文件，还包含模型、T5 文本编码器与 VAE 权重；完整规模应与发布仓库相符。

## 05 · 安装 mlx-video 运行时

在刚创建的 Wan 虚拟环境中安装上游项目：

~~~bash
python -m pip install "git+https://github.com/Blaizzy/mlx-video.git"
python -m mlx_video.models.wan_2.generate --help
~~~

**成功标志：** 安装完成并能看到视频生成参数说明。项目的 Python 模块路径可能随版本变化；**如果 `--help` 不存在，请先核对所安装的 Commit 和上游 README，而不是继续尝试生成**。

可记录安装版本：

~~~bash
python -m pip show mlx-video
~~~

## 06 · 生成第一段低负载测试视频

先确认 `--help` 包含这些参数，再根据上游格式尝试：

~~~bash
python -m mlx_video.models.wan_2.generate \
  --model-dir "$PROJECT_ROOT/models/wan22-q8" \
  --prompt "A small bird turns its head gently on a branch" \
  --width 512 --height 320 \
  --num-frames 17 --steps 20 \
  --output-path "$PROJECT_ROOT/outputs/wan-first.mp4"
~~~

这里使用的是**低负载实验参数**：512×320 均为 32 的倍数，17 帧满足 `4n+1`。能否在 32GB 机器上成功取决于当前 mlx-video 实现、模型加载和内存压力，不能提前保证。

## 07 · 核对输出结果

~~~bash
ls -lh "$PROJECT_ROOT/outputs/wan-first.mp4"
ffprobe -v error -show_entries format=duration,size -of json "$PROJECT_ROOT/outputs/wan-first.mp4"
~~~

`ffprobe` 需要先安装 FFmpeg 工具套件。**成功标志：** 实际视频可解码、可播放，终端没有生成失败信息。若运行失败，保留完整日志、内存信息、模型版本和执行命令。

## 08 · API 怎么接入？

Wan 的专用 Python/CLI 路线不等同于自带 API。完成本机生成后，可按 [Mac 07 · API Worker 设计](/mac/07-api) 做异步任务封装；若使用 ComfyUI 工作流，应另外准备该运行时所需的节点和模型格式。

相关页面：[Mac 模型下载](/mac/04-models) · [容量计算](/mac/recommend/) · [MLX 运行时排障](/mac/troubleshooting)。

参考：[mlx-video 仓库](https://github.com/Blaizzy/mlx-video) · [Wan MLX Q8 模型卡](https://huggingface.co/Anes1032/Wan2.2-TI2V-5B-mlx-q8)。