# Mac 安装 Ollama：第一次本地聊天

1. 从 [Ollama 官网](https://ollama.com/download/mac) 下载并启动 macOS 应用。
2. 打开终端，输入 `ollama --version`。显示版本即为安装完成。
3. 下载一个[官方模型库中存在的模型](https://ollama.com/library/qwen2.5:3b)：

```bash
ollama pull qwen2.5:3b
ollama run qwen2.5:3b
```

在终端输入“你好”，等待模型输出回复。输入 `/bye` 退出。

4. 测试本地 API：

```bash
curl -f http://127.0.0.1:11434/api/tags
```

**验收标准：** 模型能够真实回复，API 返回 JSON。模型使用前请检查许可证、磁盘空间及[容量估算](/recommend/)；不要将未加鉴权的服务端口直接暴露到公网。

继续：[Mac HTTP API](/mac/07-api) · [选择部署路线](/guide/start)。
