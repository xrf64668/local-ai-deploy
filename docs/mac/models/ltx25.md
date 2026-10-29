# Mac · LTX-2.5 MLX Q4 视频实践

**定位：进阶教程 / 特定机器低负载实践记录。** 不是一条“所有 Apple Silicon 都能直接运行”的通用安装命令。

## 路线与状态

| 字段 | 已有信息 |
| --- | --- |
| 硬件基线 | Apple Silicon M4 / 32GB 统一内存 |
| 模型 | LTX-2.5 的特定 MLX Q4 转换权重 |
| 推理后端 | 对应版本的 `ltx-2-mlx` |
| 低负载参数 | 约 512×320、25 model frames，distilled 路线 |
| 已验证结论 | 该机器/版本组合具备低负载实践记录 |
| **没有保证** | 长视频、720P、其他芯片和所有权重版本稳定 |

## 第一步：核对下载来源

确认使用的确实是对应的 MLX 转换仓库，记录其 revision 和后端 Git Commit。不能把普通 PyTorch 权重直接传给 MLX 加载器，也不能因为缺少 `config.json` 就伪造配置文件。

参考：[ltx-2-mlx](https://github.com/dgrauet/ltx-2-mlx)；以所选模型发布仓库的文件列表为准。

## 第二步：使用原有独立环境

如果你的 LTX 部署项目已经成功跑过最小任务，优先沿用现有环境与命令，**不要为了安装 Wan 或 ComfyUI 而修改 LTX 依赖**。

运行前确认：

```bash
uname -m
memory_pressure -Q
df -h .
```

具体生成参数和 Python 入口应以**实际安装的运行时版本及其 README/CLI 帮助**为准。本页不会编造一个尚未核对的通用 LTX 推理命令。

## 第三步：验证输出

需要记录：分辨率、model frames、采样步数、模型版本、运行时版本、生成时间、输出文件。视频生成后使用 `ffprobe` 验证其可解码性。

**验收结果：** 能打开实际生成视频，且可以复现同一配置。不能用“加载成功”代替“生成成功”。

## API 现状

专用 CLI 不会自动变成视频 HTTP 服务。要接入 Java/移动端，需要按 [07 · API Worker 设计](/mac/07-api) 封装真实 CLI、任务队列和结果下载；当前不声明存在可直接运行的 LTX API。

如果只想在 ComfyUI 使用 LTX 工作流，请先核对当前 ComfyUI 节点是否支持你选定的 LTX 权重格式：[ComfyUI Mac 教程](/comfyui/mac)。
