# Ubuntu 语言模型：先完成一次本地聊天

[← 返回 Linux 配置与目标选择](/ubuntu/)

这条路线只需要安装 **Ollama**、下载一个量化语言模型、真实提问。无需安装 ComfyUI、视频模型或额外的 CUDA Toolkit。

## 01 · 检查这台电脑

在 Ubuntu 终端执行：

```bash
cat /etc/os-release
free -h
df -h .
nvidia-smi
```

**成功标志：** 能看到系统内存、磁盘剩余空间和 NVIDIA 显卡。若 `nvidia-smi` 报错，先处理驱动问题；无独立 GPU 的 CPU 路线可能可以运行，但不适用本页 GPU 容量估算。

## 02 · 选择模型

先返回 [Linux 入口](/ubuntu/) 输入自己的系统内存和显存，选择「语言模型」。容量推荐仅估算权重和额外预算，不预测运行速度。

新手可以使用 [Ollama 官方 Qwen2.5 3B 标签](https://ollama.com/library/qwen2.5:3b) 验证流程；它不是所有配置的唯一推荐。

## 03 · 安装 Ollama

打开 [官方 Linux 安装说明](https://ollama.com/download/linux)，下载并审阅官方安装脚本：

```bash
curl -fL https://ollama.com/install.sh -o ollama-install.sh
less ollama-install.sh
```

确认脚本来源和内容后，退出阅读器并执行：

```bash
sh ollama-install.sh
ollama --version
```

官方安装可能创建系统服务或修改系统目录，和自行隔离 Python 模型项目不同。安装失败时不要在没有检查日志前重复运行。

## 04 · 从官方模型库下载并运行

```bash
ollama pull qwen2.5:3b
ollama list
ollama run qwen2.5:3b
```

在聊天中输入「请解释本地 AI 是什么」。**真正收到回答才算成功。** 进入其他模型时应统一修改三处标签，并核对上游许可证。

## 05 · 想通过 Java 或其他程序调用？

完成聊天之后再使用 Ollama 自带的本机 HTTP 接口；不要向公网直接暴露无鉴权端口。

[Ubuntu Ollama 完整教程及 API](/ubuntu/ollama) · [国内外下载说明](/guide/model-download)