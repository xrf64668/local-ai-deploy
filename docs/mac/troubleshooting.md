# Mac 模型部署常见错误

先保留完整错误日志，记录 macOS、Apple Silicon 芯片、内存、模型 revision、Python 版本与后端版本，再做最小范围的修复。

| 问题 | 先检查 | 不建议 |
| --- | --- | --- |
| `python / pip not found` | 当前是否激活项目内 venv，解释器版本是否符合要求 | `sudo pip install` 到系统 Python |
| 缺少 `config.json` | 该运行时实际要求的配置布局 | 复制其他模型的假配置 |
| 语言/文本编码器加载失败 | 文本编码器与模型架构、转换权重是否配套 | 用其他代际权重强行凑合 |
| Metal 内存不足 | 分辨率、帧数、模型量化、系统内存压力 | 同时开多个视频推理 |
| 视频文件不可播放 | 是否真正完成生成、VAE/FFmpeg 是否报错、ffprobe 输出 | 只根据 exit code 判断成功 |
| `Connection refused` | 服务是否启动、端口和监听主机 | 直接开放到公网 |
| API 401 / 403 | 凭据、权限和访问日志 | 在公开 Issue 贴 API Key |
| ComfyUI 报缺失节点 | 工作流要求、插件来源与版本 | 从未知网站复制安装脚本 |

## 安全的排障信息采集

```bash
sw_vers
uname -m
sysctl -n hw.memsize
memory_pressure -Q
df -h .
```

完整错误日志可能包含本地路径、用户名和密钥；提交公开 Issue 前要清理敏感信息。

## 进一步阅读

- [01 · 硬件预检](/mac/01-preflight/)
- [05 · 真实推理验证](/mac/05-verify/)
- [ComfyUI 跨平台常见问题](/comfyui/troubleshooting/)
