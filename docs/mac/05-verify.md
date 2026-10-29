# 05 · 从文件完整到真正生成

模型存在于磁盘，最多说明“下载了文件”。本站用更严格的五层标准验证能否运行。

## 分层验收

| 等级 | 验证对象 | 能证明什么 |
| --- | --- | --- |
| 1 · 文件 | 模型文件存在且来源可信 | 权重已下载 |
| 2 · 结构 | 配置、模型架构、编码器与 VAE | 格式与预期一致 |
| 3 · 加载 | Python 包、运行时、GPU/Metal 加载 | 后端能读取模型 |
| 4 · 推理 | 单次低负载生成实际完成 | 至少一项参数配置可运行 |
| 5 · 产物 | 文件可播放、尺寸与帧数符合预期 | 输出可用 |

视频任务应同时核对 FFmpeg / ffprobe：

```bash
ffprobe -v error -show_entries format=duration,size -of json path/to/result.mp4
```

把 `path/to/result.mp4` 替换为实际文件；如果尚未安装 ffprobe，应先根据系统工具安装要求准备，不能忽略报错。

## 推荐记录的测试报告

```json
{
  "model": "某个准确模型仓库与 revision",
  "runtime": "对应运行时及 Commit",
  "platform": "Mac Apple Silicon",
  "memory_gib": 32,
  "profile": "实际分辨率、帧数、步数",
  "result": "PASS 或 FAIL",
  "artifact": "实际输出文件位置",
  "verified_at": "测试执行的真实日期"
}
```

以上是**空白记录格式示例**，不是预先完成的实测。

::: warning 不能用通过一次推断所有参数可运行
例如 512×320、短帧数视频能够生成，不意味着 720P 或较长视频就能稳定运行。分辨率、模型版本、VAE 解码和内存压力都可能改变结果。
:::

下一步：[06 · 推理与资源控制](/mac/06-inference)。
