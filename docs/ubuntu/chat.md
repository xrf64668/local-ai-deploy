# Ubuntu 语言模型：一页完成安装、下载和真实聊天

本页专门针对 Ubuntu 的 Ollama，**完成全部步骤不需要反复跳转到模型推荐器或下载向导**。

<DeploymentSelection />

## 01 · 检查系统与硬件

在终端运行：

```bash
cat /etc/os-release
free -h
df -h .
nvidia-smi
```

检查系统内存、磁盘和 GPU。没有 NVIDIA GPU 时，`nvidia-smi` 可能不存在，但 Ollama 的 CPU 路线仍可尝试，速度和内存占用需本机验证。若使用 NVIDIA 加速却读不到显卡，应先修复驱动。

## 02 · 安装 Ollama

从 [Ollama 官方 Linux 下载页](https://ollama.com/download/linux) 获取安装脚本。先保存、审阅，再运行：

```bash
curl -fL https://ollama.com/install.sh -o ollama-install.sh
less ollama-install.sh
```

确认来源与内容后，按 `q` 退出阅读器：

```bash
sh ollama-install.sh
ollama --version
```

**成功标志：** 输出版本号。这个官方安装流程可能创建系统服务；如果没有权限或安装失败，应先查看报错，不要重复覆盖原有系统配置。

## 03 · 下载并运行你选的模型

<OllamaQuickSteps platform="ubuntu" />

如果从 Ubuntu 硬件入口选了 Qwen、Gemma、Llama 等型号，它会自动带进上面的模型下拉框。运行后真正得到回答才算成功。

## 04 · 失败时如何处理

| 现象 | 处理 |
| --- | --- |
| 下载失败 | 检查官方标签、磁盘和网络，官方源受限时按网络条件使用科学上网 |
| `nvidia-smi` 错误 | 检查 NVIDIA 驱动，勿用重复安装 PyTorch 来修复 |
| 有 GPU 但占用不符合预期 | 在本机查看 Ollama 运行状态，可能使用 CPU 或部分卸载 |
| 模型回复失败 | 先尝试更小的量化标签，查看实际错误和内存占用 |

**完成标准：** 目标模型出现在 `ollama list`，并且用 `ollama run` 收到文字回答。

::: details 进阶：服务器服务化和 API
Ubuntu Ollama 的服务管理、HTTP API 与高级调优请参考 [完整技术说明](/ubuntu/ollama)。首次部署不必继续。
:::
