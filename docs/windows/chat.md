# Windows 语言模型：一页安装、下载并开始聊天

**本页连续完成全部操作。** 不需要在容量计算、模型库和 PowerShell 教程之间来回切换。

<DeploymentSelection />

## 01 · 查看 Windows 配置

打开「设置 → 系统 → 关于」查看 RAM，在「任务管理器 → 性能 → GPU」查看显卡。你在前一页输入的内存、显存和磁盘会显示在本页顶部，不需要重新填写。

## 02 · 安装官方 Ollama

1. 打开 [Ollama Windows 官方下载](https://ollama.com/download/windows)。
2. 下载 Windows 安装包，按向导安装并启动。
3. 打开 PowerShell：

```powershell
ollama --version
```

**成功标志：** 显示版本号。第一次聊天不需要额外安装 Git、Python 或 CUDA Toolkit。

## 03 · 选择模型、下载、检查、运行

<OllamaQuickSteps platform="windows" />

如果从网站的 Windows 推荐结果进入，本页已经预先选择那个模型。也可以在此直接调整，然后从上到下运行显示的三条命令。

## 04 · 常见问题

| 现象 | 处理 |
| --- | --- |
| `ollama` 找不到 | 确认程序已经安装并启动，重新打开 PowerShell |
| 下载出错 | 检查网络、模型标签和磁盘；官方源受限时可根据网络情况使用科学上网 |
| 显存或内存不足 | 更换上方列表里更小的模型；不能只靠下载大小判断运行能力 |
| 没有得到回答 | 查看 Ollama 实际运行日志，而不是把下载成功视为部署成功 |

**完成标准：** `ollama list` 有当前模型，`ollama run` 可以正常回复。

::: details 进阶：需要 API 或配置其他模型存储位置
完成首次对话之后，再阅读 [Windows Ollama 技术说明](/windows/ollama)。这些操作不属于新手必经步骤。
:::
