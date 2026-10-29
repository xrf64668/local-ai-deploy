# Mac 本地 AI 部署向导

先填写 Mac 配置，再选择模型类型与具体模型，按顺序安装、下载、运行和验证。**主流程在当前页面完成，不要求你在多个页面之间反复跳转。**

<MacUnifiedWizard />

**工程质量标准：**[V2 模型部署与工程验收规范](/contribute/v2-deployment-standard)。未通过核验的部署方案不能标记为已验证。

## 关于当前 V2 的支持情况

- **语言模型**：已整合 Ollama 的容量初筛、模型选择、安装、下载、运行以及可选的 HTTP API 检查，步骤可直接在本页操作。
- **图像、视频和语音模型**：硬件与类型选择已纳入统一向导，完整安装流程仍使用原有专项教程；这部分尚未实现真正的一页闭环。
- 所有推荐都是参考筛选，**不代表网站已经在你的电脑上下载模型或验证推理成功**。

::: details 进阶技术文档（非新手必经步骤）
需要理解推理框架、量化、环境隔离或独立 API 服务时，可自行参考：

[硬件预检](/mac/01-preflight) · [项目环境](/mac/02-environment) · [推理框架](/mac/03-runtime) · [模型下载](/mac/04-models) · [推理验证](/mac/05-verify) · [资源控制](/mac/06-inference) · [HTTP API](/mac/07-api)

专项教程：[语言模型](/mac/chat) · [图像生成](/mac/image) · [视频生成](/mac/video) · [语音识别](/mac/audio)

[模型搜索](/guide/model-search) · [下载方法](/guide/model-download) · [Mac 故障排查](/mac/troubleshooting)
:::
