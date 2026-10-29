# Mac · 用 Ollama 部署第一个语言模型

适用：Apple Silicon Mac，希望快速通过终端与 HTTP API 使用本地聊天模型。Ollama 是一条**与 MLX 视频模型独立**的路线。

## 第一步：安装 Ollama

打开 [Ollama 官方下载页](https://ollama.com/download/mac)，下载 macOS 版本并按提示安装、打开应用。确认来源属于 Ollama 官方网站。

打开终端：

```bash
ollama --version
```

**成功标志：** 打印版本号。若终端找不到命令，检查应用是否安装完成、是否需要重新打开终端或将 CLI 添加到 PATH。

## 第二步：下载一个支持的模型

到 [Ollama 模型库](https://ollama.com/library) 选择与你的内存相符、许可证允许使用的模型，复制**准确的模型标签**。例如可先考虑较小的量化文本模型，但不同版本模型资源需求可能不同。

```bash
ollama pull 模型名称:标签
ollama list
```

**成功标志：** `ollama list` 中出现你下载的模型。示例里的中文占位符需要替换，不能原样执行。

## 第三步：实际聊天

```bash
ollama run 模型名称:标签
```

输入“请用两句话解释什么是本地大模型”，等待文本回复。输入 `/bye` 可以退出。

**成功标志：** 返回模型生成的自然语言内容，且不是下载或加载错误。

## 第四步：检查 HTTP API

```bash
curl -f http://127.0.0.1:11434/api/tags
```

然后使用 [07 · Mac API](/mac/07-api) 中的 `/api/chat` 示例。Ollama 默认端口是 11434；若服务未运行，需要先启动 Ollama 应用，且不要在未检查的情况下改成监听公网。

## 常见问题

| 问题 | 解决方向 |
| --- | --- |
| 找不到命令 | 检查安装、终端 PATH |
| 下载失败 | 网络、磁盘、模型名称与标签 |
| 内存不足 | 换小模型或更低量化版本 |
| API 连接拒绝 | 确认 Ollama 应用/服务已经启动 |

官方资料：[Ollama macOS](https://ollama.com/download/mac) · [Ollama API](https://docs.ollama.com/api/introduction)。
