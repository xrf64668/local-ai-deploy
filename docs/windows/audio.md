# Windows 语音识别：使用 Whisper 转写录音

<DeploymentSelection />

[← 返回 Windows 配置与目标选择](/windows/)

这条路线使用 **whisper.cpp + GGML 多语言模型**。不需要先装 Ollama、ComfyUI 或视频模型。

## 01 · 检查开发工具

需要 [Git](https://git-scm.com/download/win)、[CMake](https://cmake.org/download/) 和具有 C++ 编译功能的 [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) 或等效编译工具。

打开 PowerShell 检查：

```powershell
git --version
cmake --version
```

后续建议在配置好 C++ 编译环境的开发者 PowerShell 中操作；如果编译失败，先检查 CMake 生成器和编译器。

## 02 · 在自己选择的项目目录安装

先在资源管理器创建一个空文件夹，并在这个文件夹打开 PowerShell：

```powershell
$ProjectRoot = (Get-Location).Path
git clone https://github.com/ggml-org/whisper.cpp.git (Join-Path $ProjectRoot 'src')
cmake -S .\src -B .\build
cmake --build .\build --config Release
```

**成功标志：** 构建完成，并能在 `build\bin\Release` 或 `build\bin` 中找到 `whisper-cli.exe`（具体取决于 CMake 生成器）。

## 03 · 下载多语言 GGML 权重

上游提供 Windows 的下载脚本。打开 [whisper.cpp 模型说明](https://github.com/ggml-org/whisper.cpp)，确认脚本与仓库版本，再执行：

```powershell
cmd /c ".\src\models\download-ggml-model.cmd base"
Get-Item .\src\models\ggml-base.bin
```

**成功标志：** `ggml-base.bin` 文件存在。这是多语言 base，不是仅英语版本。

## 04 · 第一次识别（使用上游示例音频）

在项目目录的 PowerShell 中执行：

```powershell
$Exe = '.\build\bin\Release\whisper-cli.exe'
if (!(Test-Path $Exe)) { $Exe = '.\build\bin\whisper-cli.exe' }
& $Exe -m .\src\models\ggml-base.bin -f .\src\samples\jfk.wav
```

**成功标志：** 终端输出真实识别文字。之后可以用 FFmpeg 将自己的录音转成 16kHz 单声道 WAV，再按实际路径替换 `-f` 参数。

::: details 进阶：准确率与模型大小
多语言模型还有 small/medium 等版本，会增加下载大小和运行内存。先完成 base 的真实识别，再根据自己的语言和音频质量选择模型。
:::

[whisper.cpp 上游说明](https://github.com/ggml-org/whisper.cpp) · [跨平台模型下载](/guide/model-download)