# 从零开始：找到模型并在自己电脑上运行

第一次部署本地 AI，按这个顺序操作就行：**选择自己电脑 → 找适合的模型 → 下载对应版本 → 跑出第一个结果**。不需要先了解 HTTP API、Git revision、模型量化等所有概念。

<DeploymentPathPicker />

## 接下来只需要做四件事

1. **认识自己的电脑**：确认是 Mac、Ubuntu 还是 Windows，以及内存、显存和磁盘剩余空间。
2. **选择模型**：不知道名字就 [按电脑推荐模型](/recommend/)；知道名字就去 [搜索官方模型仓库](/guide/model-search)。
3. **下载模型**：根据 [新手下载教程](/guide/model-download) 选官方源、国内可用渠道，复制与设备匹配的下载命令，也可以直接 [生成专属下载路线](/guide/deploy)。
4. **第一次运行**：真正生成文字、图片或视频；出现错误时检查日志，而不是把“下载完成”当作成功。

::: tip 我是第一次使用，要不要学 API？
**不需要。** 先完成首次生成。只有当你想让 Java、手机 App、网页或其他程序调用本地模型时，再学习 [HTTP API 接入](/mac/07-api) 或 [ComfyUI API](/comfyui/api)。
:::

## 快速进入对应教程

| 我要实现 | 从这里开始 |
| --- | --- |
| Mac 本地聊天 | [Mac Ollama 入门](/mac/models/ollama) |
| Windows / Ubuntu 本地聊天 | [Windows](/windows/ollama) · [Ubuntu](/ubuntu/ollama) |
| 本地生成图片 | [ComfyUI 第一次生成](/comfyui/first-workflow) |
| Mac 本地生成视频 | [LTX-2.5](/mac/models/ltx25) · [Wan2.2](/mac/models/wan22) |
| 不知道硬件适合什么 | [容量推荐器](/recommend/) |
