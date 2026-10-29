# Ubuntu 安装 Ollama：第一次本地对话

适用于 Ubuntu 桌面和服务器。先运行普通语言模型，再按需要使用 ComfyUI 或部署视频模型。

## 01 · 检查系统

在 Ubuntu 终端执行：

```bash
cat /etc/os-release
df -h .
nvidia-smi
```

**成功标志：** 读到系统版本、可用磁盘空间；有 NVIDIA GPU 时应看到显卡型号和驱动。没有独立 GPU 的机器可以研究 CPU 路线，但运行速度需要实测。

## 02 · 安装 Ollama

打开 [官方 Linux 安装说明](https://ollama.com/download/linux)。下面把官方安装脚本**先下载到当前文件夹，供你查看内容**，再执行：

```bash
curl -fL https://ollama.com/install.sh -o ollama-install.sh
less ollama-install.sh
```

`curl` 下载脚本，`less` 查看文件，按 `q` 退出。**安装脚本可能更改系统级目录、创建服务并请求管理员权限**，确认来源和操作后再执行：

```bash
sh ollama-install.sh
ollama --version
```

**成功标志：** 输出 Ollama 版本。失败时记录完整报错，不重复盲目执行。

## 03 · 检查服务

```bash
systemctl status ollama --no-pager
curl -f http://127.0.0.1:11434/api/tags
```

**成功标志：** HTTP 接口返回 JSON；如服务未运行，按官方 Linux 文档检查启动方式。

## 04 · 下载模型并实际对话

本例选用 [qwen2.5:3b](https://ollama.com/library/qwen2.5:3b)。下载前核对模型许可证与磁盘空间：

```bash
ollama pull qwen2.5:3b
ollama list
ollama run qwen2.5:3b
```

在对话窗口输入“请解释什么是本地模型”，等待回复。输入 `/bye` 退出。

**成功标志：** 模型返回真实文字回答，而不只是下载成功。

## 05 · 调用本地 API

```bash
curl -s http://127.0.0.1:11434/api/chat -H 'Content-Type: application/json' -d '{"model":"qwen2.5:3b","messages":[{"role":"user","content":"你好"}],"stream":false}'
```

**成功标志：** 返回包含回答的 JSON。远程访问应使用受保护的方式，不要直接将没有鉴权的端口对公网开放。

## 故障排查

| 现象 | 先检查 |
| --- | --- |
| 找不到 Ollama 命令 | 安装日志和 PATH |
| GPU 不可用 | NVIDIA 驱动、系统日志；CPU 路线需另行测试 |
| 模型下载失败 | 网络、磁盘空间、模型名称 |
| 11434 连接失败 | Ollama 服务状态与端口 |

**继续学习：** [计算模型容量](/recommend/) · [Ubuntu ComfyUI](/comfyui/ubuntu)
