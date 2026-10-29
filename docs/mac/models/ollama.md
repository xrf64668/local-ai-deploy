# Mac 安装 Ollama：选模型、下载、对话与 API

**适合：** 第一次在 Mac 上运行语言模型的读者。Ollama 是一条容易上手的路线，下载模型后可以直接聊天，也能通过 HTTP API 调用。

## 01 · 先选多大的模型

同一系列有不同的参数规模。以下是 [Ollama 官方 Qwen2.5 模型库](https://ollama.com/library/qwen2.5) 当前列出的下载文件量级：

| 标签 | 模型下载量级 | 适合怎样开始 |
| --- | --- | --- |
| `qwen2.5:1.5b` | 约 986MB | 想先验证安装与对话 |
| `qwen2.5:3b` | 约 1.9GB | **第一次正式体验，优先尝试** |
| `qwen2.5:7b` | 约 4.7GB | 有更充裕的统一内存，想提升模型规模 |
| `qwen2.5:14b` | 约 9.0GB | 进阶测试，先评估内存和上下文 |

这些是**下载文件体积，不是运行时的内存峰值**。长上下文还会增加 KV 缓存。可到 [Mac 容量计算器](/mac/recommend/) 输入统一内存、量化格式和上下文做估算。各版本许可证可能不同，例如 Qwen2.5 3B 有独立的 Qwen 许可条件，使用前请核对模型卡。

如果你主要写程序，也可以浏览 [Qwen2.5 Coder 模型](https://ollama.com/library/qwen2.5-coder)，选择如 `qwen2.5-coder:3b` 的代码专用版本。

## 02 · 安装 Ollama 软件

1. 打开 [官方 macOS 下载页](https://ollama.com/download/mac)。
2. 根据页面提示下载并安装，打开 Ollama。
3. 在 Mac「终端」输入：

~~~bash
ollama --version
~~~

**成功标志：** 打印 Ollama 版本。如果提示命令不存在，请确认应用安装完成、重新打开终端，再检查命令位置。

## 03 · 下载第一个模型

复制下面一行：

~~~bash
ollama pull qwen2.5:3b
~~~

**这条命令做什么？** 从 Ollama 的模型库下载指定标签的模型。模型名称和精度由该标签决定；下载中不要误以为“下载进度 100%”就代表推理已完成。

下载结束再检查：

~~~bash
ollama list
~~~

**成功标志：** 列表中出现 `qwen2.5:3b`。如果想试 7B，把两处标签一致地改成 `qwen2.5:7b` 即可。

## 04 · 国内网络与国外网络如何下载

- **国外网络 / 可直连 Ollama：** 直接执行 `ollama pull`。
- **国内网络可直连：** 同样使用官方命令；慢时先排查网络连接和磁盘空间。
- **官方服务在当前网络不可访问：** 可以根据网络条件通过**科学上网**访问官方模型服务。
- **ModelScope、HF 社区镜像：** 不直接等同于 Ollama Registry。要导入第三方 GGUF 权重，应另外通过适合的 Ollama Modelfile 进行适配，不建议新手把 HF 文件手动复制进 Ollama 内部模型目录。

完整区别见 [国内 / 国外下载教程](/guide/model-download)。

## 05 · 第一次运行模型

~~~bash
ollama run qwen2.5:3b
~~~

在终端输入：

> 请用三句话解释本地 AI 和云端 AI 的区别。

等待模型输出完整回答；输入 `/bye` 退出。

**成功标志：** 确实收到模型生成的文字。若只看到下载提示或报错，需要先排查，不能算完成部署。

## 06 · 通过 HTTP API 验证

确认 Ollama 应用仍在运行：

~~~bash
curl -f http://127.0.0.1:11434/api/tags
~~~

然后向同一个模型发出真实请求：

~~~bash
curl http://127.0.0.1:11434/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"model":"qwen2.5:3b","messages":[{"role":"user","content":"你好"}],"stream":false}'
~~~

**成功标志：** JSON 中包含模型的聊天回复。默认只在本机调用，不要把无鉴权的 11434 端口暴露到公网。

## 07 · 下载的模型保存在哪里？

Ollama Desktop 会按自己的存储设置管理模型，**与本网站的手动 MLX / ComfyUI 项目隔离目录不同**。

如果需要把**后续新下载的 Ollama 模型**保存到指定磁盘，Ollama 支持 `OLLAMA_MODELS` 环境变量，但 macOS 应用需要通过 `launchctl` 等方式配置并重新启动。改变目录不会自动搬迁已有权重；这是可选的进阶操作，请先参考 [Ollama 官方 FAQ](https://docs.ollama.com/faq) 核对当前版本。

## 常见问题

| 情况 | 先检查 |
| --- | --- |
| `ollama: command not found` | 安装状态、终端 PATH |
| 模型下载慢 | 网络、科学上网需求、磁盘空间 |
| 运行时内存不足 | 换 1.5B/3B、小上下文，关闭其他大任务 |
| API 连接被拒绝 | Ollama 应用是否已启动，11434 端口是否可用 |
| 模型下载量与占用不符 | 本地缓存、多个标签以及运行时 KV/工作区 |

接下来：[Mac 七阶段部署](/mac/) · [模型下载总指南](/guide/model-download) · [Mac API 设计](/mac/07-api)。