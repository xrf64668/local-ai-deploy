# Windows 安装 Ollama：从软件安装到模型回答

使用 Windows 官方安装包，即可开始本地聊天；第一次使用无需提前安装 Git 或 Python。

## 01 · 查看电脑配置

打开 **设置 → 系统 → 关于**，确认内存容量；再打开 **任务管理器 → 性能 → GPU** 查看显卡型号和专用显存。建议先用 [容量计算器](/recommend/) 评估要下载的模型。

## 02 · 安装 Ollama

1. 打开 [Ollama 官方 Windows 下载页](https://ollama.com/download/windows)。
2. 根据官方页面选择安装包，核对来源后安装。
3. 打开 Ollama，并在 PowerShell 中检查版本：

```powershell
ollama --version
```

**成功标志：** 显示版本号。如果命令找不到，先重新打开 PowerShell 并确认安装完成。

## 03 · 下载一个模型

本例使用 [qwen2.5:3b](https://ollama.com/library/qwen2.5:3b)，下载前请确认许可证和磁盘空间：

```powershell
ollama pull qwen2.5:3b
ollama list
```

**成功标志：** `ollama list` 里出现所下载的模型。

## 04 · 完成第一次聊天

```powershell
ollama run qwen2.5:3b
```

输入“请介绍一下本地 AI 模型”，等待回复；输入 `/bye` 退出。

**成功标志：** 模型输出实际回答。下载完成不等于推理成功。

## 05 · 验证本地 API

```powershell
curl.exe -f http://127.0.0.1:11434/api/tags
```

**成功标志：** 返回模型列表 JSON。要通过 API 生成文本，可参考 [Mac 页面中的 HTTP 请求示例](/mac/07-api)；Windows 需注意 PowerShell 和 curl.exe 的语法区别。

## 常见问题

| 现象 | 处理方向 |
| --- | --- |
| 找不到 `ollama` | 安装是否成功、PowerShell 是否重新打开 |
| 模型下载失败 | 网络、模型名称、磁盘空间 |
| 运行速度很慢 | 选更小模型、检查 CPU/GPU 使用情况 |
| API 连接失败 | Ollama 是否启动、11434 端口是否可用 |

继续：[内存计算器](/recommend/) · [ComfyUI 安装](/comfyui/windows)
