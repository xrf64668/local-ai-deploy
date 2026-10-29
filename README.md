# 本地 AI 实战指南

一份写给初学者的开源中文教程：从了解自己的设备，到安装模型、完成第一次生成，再到通过 API 调用。

**在线阅读：** https://xrf64668.github.io/local-ai-deploy/

## 从哪里开始？

| 想做什么 | 对应教程 |
| --- | --- |
| 在 Mac 上尝试本地 AI | [Mac 入门](./docs/mac/index.md) |
| 第一次用 ComfyUI 生成图片 | [ComfyUI 入门](./docs/comfyui/index.md) |
| Ubuntu / Windows 安装 ComfyUI | [Ubuntu](./docs/comfyui/ubuntu.md) · [Windows](./docs/comfyui/windows.md) |
| 按硬件选择模型 | [模型推荐器](./docs/recommend/index.md) |
| 通过程序调用本地模型 | [Mac API](./docs/mac/07-api.md) · [ComfyUI API](./docs/comfyui/api.md) |

教程按 **准备 → 操作 → 验证 → 排错** 编排。模型资源需求属于参考数据；只有完整运行并生成结果，才能认定特定配置通过验证。

## 维护网站

需要 Node.js 22，进入仓库后：

```bash
npm ci
npm run docs:dev
```

提交前运行 `npm run docs:build`。合并到 `main` 后由 GitHub Actions 部署 Pages。

内容规范：[教程编写标准](./docs/contribute/writing-standard.md)。发现问题请通过 [Issues](https://github.com/xrf64668/local-ai-deploy/issues) 反馈。

许可证：[LICENSE](./LICENSE)。

## 模型数据库自动维护

仓库已包含**只读元数据发现**工作流，每周检查 Hugging Face Hub 的指定模型/关键词，并将未验证候选作为 GitHub Actions artifact 供审核。**不会自动下载权重或将未经审核的模型写入正式推荐**。

- [模型发现、审核与真实设备数据规范](https://xrf64668.github.io/local-ai-deploy/contribute/model-lifecycle)
- [手动运行或查看模型发现工作流](https://github.com/xrf64668/local-ai-deploy/actions/workflows/model-discovery.yml)
- [提交脱敏的模型实测报告](https://github.com/xrf64668/local-ai-deploy/issues/new?template=model-benchmark.yml)

在仓库根目录执行 `npm run models:test` 进行离线测试；执行 `npm run models:discover` 查询 Hugging Face 的公开 API（需能够联网）。
