# 01 · 先检查 Mac 硬件

**目标：** 清楚自己使用哪一代 Apple Silicon、有多少统一内存，以及磁盘是否足以容纳模型；这一阶段不会安装任何东西。

## 第一步：打开终端

按 `Command + Space` 搜索「终端」，依次执行：

```bash
uname -m
sw_vers -productVersion
system_profiler SPHardwareDataType | grep -E 'Chip|Memory|Model Name'
sysctl -n hw.memsize
df -h .
```

**成功标志：** `uname -m` 输出 `arm64`；能够读到芯片、内存、macOS 版本和当前磁盘空间。若输出 `x86_64`，不要直接使用本专区的 MLX Apple Silicon 指南。

内存字节数不等于 GPU 真正可以占用的大小。32GB 统一内存的实际可用范围会随系统负载变化。

## 第二步：查看 Metal 和内存压力

```bash
system_profiler SPDisplaysDataType
memory_pressure -Q
```

**成功标志：** 显示 GPU/Metal 相关信息，并能输出当前内存状态。命令成功并不保证某个大型视频模型能运行。

## 第三步：判断要走哪条路线

| 目标 | 先阅读 | 适配说明 |
| --- | --- | --- |
| 本地文字聊天 | [Ollama](/mac/models/ollama/) | 可从较小的量化语言模型开始 |
| 节点式图像生成 | [ComfyUI for Mac](/comfyui/mac/) | 多数通过 PyTorch MPS，需选对应模型 |
| LTX 视频 | [LTX MLX 路线](/mac/models/ltx25/) | 需匹配专用 MLX 权重与运行时 |
| Wan 视频 | [Wan MLX 路线](/mac/models/wan22/) | 属于实验性验证，避免直接下载大量权重 |

## 常见问题

**终端找不到 `system_profiler`？** 先确认使用的是 macOS 标准终端环境，不要从 Windows/Linux 教程复制命令。

**为什么不能只按 M4/M5 推荐模型？** 同一芯片可能搭配不同容量的统一内存；模型量化方式和工作流中间内存也会影响结果。

下一步：[02 · 项目独立环境](/mac/02-environment/)。
