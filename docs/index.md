---
layout: home

hero:
  name: 本地 AI 实战指南
  text: 从选对模型，到真实运行
  tagline: Mac / Ubuntu / Windows · 硬件选型 · 国内外模型下载 · ComfyUI · 本地 API
  actions:
    - theme: brand
      text: 选择我的部署路线
      link: /guide/start
    - theme: alt
      text: 学习 ComfyUI
      link: /comfyui/
    - theme: alt
      text: 计算硬件容量
      link: /recommend/

features:
  - icon: "🍎"
    title: Mac · Apple Silicon
    details: 先填芯片、统一内存和磁盘，再分别进入聊天、图像、视频或语音的独立部署教程。
    link: /mac/
    linkText: 开始 Mac 部署
  - icon: "🧩"
    title: ComfyUI 全平台
    details: Mac、Ubuntu、Windows 的安装步骤、模型目录、第一次生成、工作流 API。
    link: /comfyui/
    linkText: 进入教程
  - icon: "🔎"
    title: 按硬件找模型
    details: 按参数量、量化、KV 缓存、上下文和设备内存预算实时计算容量。
    link: /recommend/
    linkText: 查看计算结果
  - icon: "🖥️"
    title: Ubuntu · NVIDIA
    details: 先填系统内存、NVIDIA 显存和磁盘，再分别进入聊天、图像、视频、语音的独立教程。
    link: /ubuntu/
    linkText: 选择部署路线
  - icon: "💻"
    title: Windows · NVIDIA
    details: 根据内存、显卡和模型类型选择教程，先完成首次生成，再看 PowerShell 与 API。
    link: /windows/
    linkText: 选择部署路线
  - icon: "🔌"
    title: 把模型变成 API
    details: Ollama 原生 HTTP、ComfyUI 异步工作流，以及视频 Worker 的设计边界。
    link: /mac/07-api
    linkText: 了解 API
---

## 新手应该按什么顺序学习？

先打开 [部署路线向导](/guide/start)，选择操作系统、任务类型和使用经验，得到可以依次操作的完整步骤。

| 你现在的情况 | 推荐起点 | 通过标准 |
| --- | --- | --- |
| 完全不懂模型和显存 | [选择部署路线](/guide/start) | 知道模型、后端与硬件的关系 |
| 只有一台 Apple Silicon Mac | [按 Mac 配置选择模型类型](/mac/) | 找到自己的独立部署教程并完成真实生成 |
| 想先用节点生成图片 | [ComfyUI 新手入口](/comfyui/) | 运行工作流并生成可打开的文件 |
| 使用 Linux NVIDIA | [Linux 分类部署](/ubuntu/) | 按自己的 GPU 与目标选择一条路线 |
| 使用 Windows NVIDIA | [Windows 分类部署](/windows/) | 先选择模型类型，再找到对应安装和验证 |
| 希望从 Java / Web 调用 | [API 服务化](/mac/07-api) | 本机请求得到真实模型返回 |
| 不知道我的配置适合什么 | [硬件容量计算](/recommend/) | 查看权重、KV 缓存、工作区及预算结果 |

::: tip 本站的原则
**每一步有命令，每一步有验收。** 不把下载完成写成部署成功；不将参考内存门槛当作官方最低要求；不声称没有做过的实测。
:::

想纠错或补充真实机器数据？前往 [GitHub Issues](https://github.com/xrf64668/local-ai-deploy/issues) 反馈。
