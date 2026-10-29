# ComfyUI 常见错误与排查

遇到报错先记下**完整日志、操作系统、GPU、显存/统一内存、ComfyUI 版本、模型权重版本和工作流来源**。不要只截图最后一行。

| 报错或现象 | 常见原因 | 优先处理 |
| --- | --- | --- |
| 8188 打不开 | 服务没启动/端口冲突 | 检查启动日志、实际端口与监听地址 |
| 缺少模型 | 下载位置不对、文件不全 | [检查模型路径](/comfyui/models-and-paths/) |
| Missing node type | 自定义节点未安装或不兼容 | 核对节点仓库来源、版本与导入错误 |
| `CUDA: False` | PyTorch wheel、驱动、显卡架构不匹配 | 先运行 GPU 检查，不继续下载模型 |
| `MPS: False` | 非 Apple Silicon 或 PyTorch/系统不兼容 | 核对 arm64、macOS、torch 版本 |
| Out of memory | 模型或生成参数超过资源 | 降低分辨率/帧数/批量，释放其他任务 |
| `/prompt` HTTP 400 | 不是 API 工作流或节点参数无效 | 检查返回的节点错误信息 |
| `/history` 没有结果 | 任务未完成、失败或服务重启 | 看队列、WebSocket、服务日志 |

## 最小化复现

1. 停止同一机器上的其他重型生成任务。
2. 使用官方基础模板，不先加载陌生的自定义节点。
3. 只执行一张低分辨率输出，确认工作流能成功。
4. 如果基本工作流成功，再逐个增加 LoRA、视频节点或扩展插件。
5. 对外分享日志时隐藏密钥、文件路径中的个人信息以及私有模型链接。

相关页面：[Mac](/comfyui/mac/) · [Ubuntu](/comfyui/ubuntu/) · [Windows](/comfyui/windows/) · [API](/comfyui/api/)。
