# Mac 语言大模型：从下载到第一次聊天

**你要完成的事：** 在自己的 Mac 上下载一个合适的聊天模型，用它回答问题。第一次不需要 Python、ComfyUI、MLX 视频框架或 HTTP API。

[← 返回 Mac 配置与任务选择](/mac/)

## 第一步 · 看硬件，选模型

打开 Mac「苹果菜单 → 关于本机」，查看**芯片、统一内存**；再到「系统设置 → 通用 → 储存空间」看剩余空间。

不知道该下载哪个模型？前往 [Mac 容量推荐](/mac/recommend/)，输入自己的统一内存。推荐器会比较模型文件、预留空间和上下文占用，显示候选，但不能预测实际质量或速度。

第一次想先验证流程，可以用较小的 **Qwen2.5 3B** 作为教学示例；如果你有更高的统一内存，可以在推荐器中改选 Qwen3.8、Gemma、DeepSeek 等。示例不代表对所有设备的最佳模型。

## 第二步 · 安装 Ollama

1. 打开 [Ollama 的 Mac 官方下载页](https://ollama.com/download/mac)。
2. 下载并打开 macOS 应用。
3. 打开「终端」，执行：

```bash
ollama --version
```

**成功标志：** 终端出现版本号。如果提示命令不存在，先检查 Ollama 是否已安装和启动。

## 第三步 · 从官方模型库下载

先打开 [Ollama 模型库](https://ollama.com/library)，搜索你在第一步选的型号，确认正确的**模型标签**。例如，轻量教学模型：

```bash
ollama pull qwen2.5:3b
```

下载结束后运行：

```bash
ollama list
```

**成功标志：** 列表中出现 `qwen2.5:3b`。选择其他模型时需要把命令中的标签一同修改。

::: details 国内网络无法下载，怎么办？
如果当前网络无法访问 Ollama 官方模型服务，可根据网络条件使用**科学上网**访问官方仓库。Ollama Registry 与 Hugging Face 不是同一个下载服务，不要将 HF-Mirror 环境变量直接当成 `ollama pull` 的镜像配置。

[国内外下载说明](/guide/model-download) · [官方模型来源](https://ollama.com/library)
:::

## 第四步 · 运行并验证

```bash
ollama run qwen2.5:3b
```

在交互界面输入：

> 请用三句话解释本地 AI 和云端 AI 有什么区别。

**成功标志：** 模型生成一段回答。输入 `/bye` 退出。下载成功不等于推理成功。

## 第五步 · 想换模型或接入自己的程序？

先回到 [Mac 容量推荐](/mac/recommend/) 选择新模型，再到 [根据当前配置生成下载命令](/guide/deploy)。要接入 Java、手机或网页时，Ollama 内置 [HTTP API](/mac/models/ollama)；这属于可选的下一步，不影响你已经完成的聊天部署。

**这一类模型的环境独立于图像 ComfyUI、视频 LTX/Wan、音频 whisper.cpp。**