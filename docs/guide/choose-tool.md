# 本地 AI 工具怎么选？

不用一次安装所有工具。**先按想完成的任务选择一条路线。**

| 想做什么 | 建议先了解 | 原因 |
| --- | --- | --- |
| 本地聊天与 HTTP API | **Ollama** | 安装与调用相对直接，适合第一次体验 |
| 运行 GGUF 量化语言模型 | **llama.cpp** | 配置灵活，适合进阶调试 |
| 图像生成与节点工作流 | **ComfyUI** | 可视化连接模型、采样和输出步骤 |
| Apple Silicon 专用推理 | **MLX 与适配的运行时** | 需匹配模型权重及对应加载器 |
| Linux GPU 高吞吐文本服务 | **vLLM** | 更适合具备 GPU 与服务部署经验的读者 |
| 用 Python 编排生成流程 | **Diffusers** | 便于写脚本与集成 |

**推荐给第一次使用的人：** Mac 先试 [Ollama](/mac/models/ollama) 或 [ComfyUI Desktop](/comfyui/mac)；Windows 可从 [ComfyUI Desktop](/comfyui/windows) 开始。

专用视频模型更依赖版本与显存条件，先阅读 [Mac LTX](/mac/models/ltx25) 或 [Wan](/mac/models/wan22) 的适配说明，不必立即下载大型权重。
