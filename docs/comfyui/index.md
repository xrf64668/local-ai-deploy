# ComfyUI：从零开始，不需要先成为程序员

ComfyUI 能通过**节点工作流**把 AI 模型组合起来生成图片或视频。本站从“我第一次安装”开始写，**默认你还不懂 Python、Git、模型权重和显存**。

::: tip 新手先记住
**软件安装成功 ≠ 模型已经下载 ≠ 真正生成成功。** 这三件事需要分别验证。本网站的每一篇教程都会告诉你当前完成的是哪一步。
:::

## 第一步：选你正在使用的电脑

| 使用的电脑 | 最容易开始的路线 | 需要命令行吗？ |
| --- | --- | --- |
| **Mac · M 系列芯片** | [Mac Desktop 图形安装](/comfyui/mac) | **不用** |
| **Windows · NVIDIA 显卡** | [Windows Desktop 图形安装](/comfyui/windows) | **不用** |
| **Ubuntu · NVIDIA 显卡** | [Ubuntu 手动安装](/comfyui/ubuntu) | 需要，逐步解释 |

## 第二步：先让软件启动

从你电脑对应的教程开始。Mac 和 Windows 用户先按官方 Desktop 安装，不用一开始学习 Git、Python 或处理驱动命令。

Ubuntu 服务器需要终端，但每一步应先知道该命令的用途，再执行安装。

## 第三步：生成第一张图片

当画布能打开，继续 [第一次生成图片](/comfyui/first-workflow)；要确认**具体模型文件和工作流**齐全，才能验证是否真的能运行。

## 第四步：按需要学习进阶知识

| 你接下来想做什么 | 阅读 |
| --- | --- |
| 看懂 Python、Git、MPS、CUDA | [新手术语词典](/comfyui/glossary) |
| Mac 想自己管理 Python 环境 | [Mac 手动安装进阶篇](/comfyui/mac-manual) |
| 不知道模型放哪里 | [模型目录和常见权重](/comfyui/models-and-paths) |
| 遇到缺少节点或内存报错 | [常见问题排查](/comfyui/troubleshooting) |
| 想用 Java、Python、Web 调用 | [ComfyUI API](/comfyui/api) |

## 重要的安全提示

不要把未经鉴权的 ComfyUI 端口直接公开到互联网。Mac 的 ComfyUI 通常使用 PyTorch MPS，而另行部署的 MLX 视频模型是不同的运行方案。

参考：[ComfyUI 官方下载](https://www.comfy.org/download) · [官方安装文档](https://docs.comfy.org/installation/manual_install)
