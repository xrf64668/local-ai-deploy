# Mac 语音模型：用 Whisper 把录音转成文字

<DeploymentSelection />

**你要完成的事：** 使用开源的 whisper.cpp，在 Mac 本地把音频转换成文字。本页先教**语音识别**，不是语音克隆或语音合成。

[← 返回 Mac 配置与任务选择](/mac/)

## 第一步 · 看硬件，选轻量模型

Apple Silicon 的 Mac 可以先使用较小的 Whisper **base 多语言 GGML** 模型，了解真实推理流程。上游给出的 base 模型文件约 142MiB，运行时占用更高，具体以本机为准。

打开 [Whisper GGML 模型文件列表](https://huggingface.co/ggerganov/whisper.cpp/tree/main)。中文识别优先使用多语言 `base`，不要选仅针对英语的 `base.en`。

## 第二步 · 自己选择一个独立文件夹

在 Finder 创建一个空的「语音项目」文件夹，在该文件夹打开终端，然后执行：

```bash
PROJECT_ROOT="$(pwd -P)"
uname -m
git --version
cmake --version
ffmpeg -version
```

**成功标志：** `uname -m` 输出 `arm64`，其他三个命令都能输出版本。若缺少 Git、CMake 或 FFmpeg，请先通过对应工具的官方安装指南安装，再继续。

## 第三步 · 下载运行工具并在项目中编译

```bash
git clone https://github.com/ggml-org/whisper.cpp.git "$PROJECT_ROOT/src"
cmake -S "$PROJECT_ROOT/src" -B "$PROJECT_ROOT/build" -DCMAKE_BUILD_TYPE=Release
cmake --build "$PROJECT_ROOT/build" --config Release -j 4
"$PROJECT_ROOT/build/bin/whisper-cli" --help
```

**成功标志：** CLI 能显示帮助。项目代码和编译产物仍在你选择的文件夹下。

## 第四步 · 下载多语言 Whisper 模型

```bash
mkdir -p "$PROJECT_ROOT/models"
bash "$PROJECT_ROOT/src/models/download-ggml-model.sh" base "$PROJECT_ROOT/models"
ls -lh "$PROJECT_ROOT/models/ggml-base.bin"
```

**成功标志：** 模型文件存在，且大小与上游仓库相符。仓库下载不稳定时，可根据网络条件使用科学上网，并先核对上游文件来源。

## 第五步 · 转写自己的录音

把自己的一段录音放到这个项目的 `audio/` 文件夹中，命名为 `input.mp3`（如果来源是其他格式，可按实际文件名更改）。然后执行：

```bash
mkdir -p "$PROJECT_ROOT/audio" "$PROJECT_ROOT/outputs"
ffmpeg -y -i "$PROJECT_ROOT/audio/input.mp3" -ar 16000 -ac 1 -c:a pcm_s16le "$PROJECT_ROOT/audio/input.wav"
"$PROJECT_ROOT/build/bin/whisper-cli" \
  -m "$PROJECT_ROOT/models/ggml-base.bin" \
  -f "$PROJECT_ROOT/audio/input.wav" \
  -otxt -of "$PROJECT_ROOT/outputs/transcript"
```

**成功标志：** 终端出现识别内容，`outputs/transcript.txt` 中能看到转写后的文字。小模型可能有识别错误，请结合真实音频核对。

::: details 进阶：怎么换更高精度的模型？
上游还有 `small`、`medium`、`large-v3-turbo` 等不同体积模型，但内存和下载量明显增加。先完成 base 版本的第一次真实转写，再根据自己的统一内存与实际准确率决定是否升级。

参考 [whisper.cpp 官方使用说明](https://github.com/ggml-org/whisper.cpp) 和 [模型发布页](https://huggingface.co/ggerganov/whisper.cpp/tree/main)。
:::

这条语音路线与 Ollama、ComfyUI、LTX/Wan 独立，不需要安装它们。