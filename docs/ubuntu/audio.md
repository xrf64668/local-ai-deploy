# Ubuntu 语音识别：用 Whisper 把录音变成文字

<DeploymentSelection />

[← 返回 Linux 配置与目标选择](/ubuntu/)

**这不是语音合成或声音克隆。** 第一次只部署 `whisper.cpp` 和较小的多语言 `base` 模型，完成真实语音转写，不需要视频或图像模型。

## 01 · 准备工具

在 Ubuntu 终端执行：

```bash
sudo apt update
sudo apt install -y git cmake build-essential ffmpeg
```

系统工具通过 Ubuntu 包管理器安装，属于系统依赖；模型代码、缓存及输出放在用户自己选择的项目中。

## 02 · 选择一个项目目录并编译

在自己准备的空文件夹中打开终端，然后：

```bash
PROJECT_ROOT="$(pwd -P)"
git clone https://github.com/ggml-org/whisper.cpp.git "$PROJECT_ROOT/src"
cmake -S "$PROJECT_ROOT/src" -B "$PROJECT_ROOT/build" -DCMAKE_BUILD_TYPE=Release
cmake --build "$PROJECT_ROOT/build" --config Release -j 4
"$PROJECT_ROOT/build/bin/whisper-cli" --help
```

**成功标志：** 看到 CLI 的帮助信息。

## 03 · 下载正确的语音模型

上游 [GGML 模型目录](https://huggingface.co/ggerganov/whisper.cpp/tree/main) 提供不同规模。首次使用 `base` 多语言权重：

```bash
bash "$PROJECT_ROOT/src/models/download-ggml-model.sh" base
ls -lh "$PROJECT_ROOT/src/models/ggml-base.bin"
```

**成功标志：** 权重文件存在；不要选择仅英语的 `base.en` 用于中文识别。

## 04 · 转写自己的音频

把自己的音频放进项目 `audio/input.mp3`，然后执行：

```bash
mkdir -p "$PROJECT_ROOT/audio" "$PROJECT_ROOT/outputs"
ffmpeg -y -i "$PROJECT_ROOT/audio/input.mp3" -ar 16000 -ac 1 -c:a pcm_s16le "$PROJECT_ROOT/audio/input.wav"
"$PROJECT_ROOT/build/bin/whisper-cli" \
  -m "$PROJECT_ROOT/src/models/ggml-base.bin" \
  -f "$PROJECT_ROOT/audio/input.wav" \
  -otxt -of "$PROJECT_ROOT/outputs/transcript"
```

**成功标志：** 出现真实识别结果，`outputs/transcript.txt` 有文字，检查实际准确度后再决定要不要更大模型。

[上游 whisper.cpp](https://github.com/ggml-org/whisper.cpp) · [国内与国外的模型下载方法](/guide/model-download)