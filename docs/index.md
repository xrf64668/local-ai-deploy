---
layout: home

hero:
  name: 本地 AI 部署指南
  text: 从第一次安装，到真正运行模型
  tagline: Mac / Ubuntu / Windows · 逐步命令、成功标志、错误排查、ComfyUI 和 API 接入
  actions:
    - theme: brand
      text: 开始 Mac 教程
      link: /mac/
    - theme: alt
      text: 学习 ComfyUI
      link: /comfyui/
    - theme: alt
      text: 按硬件选模型
      link: /recommend/

features:
  - icon: "🍎"
    title: Mac · Apple Silicon
    details: 完整 01–07 过程，从芯片检查、MLX/Ollama 运行时到模型验证与 API。
    link: /mac/
    linkText: 从这里开始
  - icon: "🧩"
    title: ComfyUI 全平台
    details: Mac、Ubuntu、Windows 的安装步骤、模型目录、第一次生成、工作流 API。
    link: /comfyui/
    linkText: 进入教程
  - icon: "🔎"
    title: 按硬件找模型
    details: 根据平台、统一内存、显存和用途初筛；明确区分估算与实际验证。
    link: /recommend/
    linkText: 打开推荐器
  - icon: "🖥️"
    title: Ubuntu · NVIDIA
    details: GPU 服务器环境、CUDA 预检、ComfyUI 路线与显存排障。
    link: /comfyui/ubuntu/
    linkText: 查看教程
  - icon: "💻"
    title: Windows · NVIDIA
    details: 图形安装与 PowerShell 手动安装，学会检查 CUDA 和模型目录。
    link: /comfyui/windows/
    linkText: 查看教程
  - icon: "🔌"
    title: 把模型变成 API
    details: Ollama 原生 HTTP、ComfyUI 异步工作流，以及视频 Worker 的设计边界。
    link: /mac/07-api/
    linkText: 了解 API
---

## 新手应该按什么顺序学习？

| 你现在的情况 | 推荐起点 | 通过标准 |
| --- | --- | --- |
| 完全不懂模型和显存 | [本地 AI 基础](/guide/what-is-local-ai) | 知道模型、后端与硬件的关系 |
| 只有一台 Apple Silicon Mac | [Mac 七阶段](/mac/) | 完成环境检查与一次真实推理 |
| 想先用节点生成图片 | [ComfyUI 新手入口](/comfyui/) | 运行工作流并生成可打开的文件 |
| 希望从 Java / Web 调用 | [API 服务化](/mac/07-api/) | 本机请求得到真实模型返回 |
| 不知道我的配置适合什么 | [硬件推荐器](/recommend/) | 获得标注了证据等级的候选 |

::: tip 本站的原则
**每一步有命令，每一步有验收。** 不把下载完成写成部署成功；不将参考内存门槛当作官方最低要求；不声称没有做过的实测。
:::

想纠错或补充真实机器数据？前往 [GitHub Issues](https://github.com/xrf64668/local-ai-deploy/issues) 反馈。
