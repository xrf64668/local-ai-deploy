# Windows 语言模型：安装软件、下载、开始聊天

[← 返回 Windows 配置与目标选择](/windows/)

这条路线只需 Ollama 的 **Windows 安装包**。第一次不必先配置 Git、Python、CUDA 或 HTTP API。

## 01 · 查看配置，选择模型

在 Windows「设置 → 系统 → 关于」查看系统内存，在「任务管理器 → 性能 → GPU」查看显卡型号与专用显存。

回到 [Windows 入口](/windows/) 填入自己的内存、显存和磁盘，选择「语言模型」。先用容量较小的量化模型验证安装过程。

## 02 · 下载 Ollama

1. 进入 [Ollama 官方 Windows 下载页](https://ollama.com/download/windows)。
2. 下载并运行官方安装包，打开 Ollama。
3. 启动 PowerShell，检查版本：

```powershell
ollama --version
```

**成功标志：** 打印 Ollama 版本号。

## 03 · 下载第一个模型

在 [Ollama 官方模型库](https://ollama.com/library) 查询准确标签。下面使用轻量教学示例：

```powershell
ollama pull qwen2.5:3b
ollama list
```

**成功标志：** 模型列表包含 `qwen2.5:3b`。

如果下载失败，检查网络、模型标签和磁盘空间；官方源访问受限时可根据当地网络条件使用科学上网，不要直接把 Hugging Face 的原始 PyTorch 权重塞进 Ollama 内部目录。

## 04 · 开始聊天

```powershell
ollama run qwen2.5:3b
```

输入「请用三句话解释本地部署」，等待实际回答，输入 `/bye` 退出。**下载完成不代表部署完成。**

## 05 · 开发者才需要 HTTP API

确认 Ollama 已启动后可通过 `curl.exe` 调用本机接口；第一次聊天不需要做这一步。

[Windows Ollama API 与故障排查](/windows/ollama) · [模型下载指南](/guide/model-download)