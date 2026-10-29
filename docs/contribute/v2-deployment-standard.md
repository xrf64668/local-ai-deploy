# Local AI Deploy V2 · 工程与部署规范（规范基线）

> 适用范围：macOS、Windows、Linux 的模型发现、方案生成、权重下载、环境安装、首次推理及 API 发布。这里是一套项目工程标准，并非宣称存在单一全球统一部署标准。

## 一、不可妥协的规则

1. **可追溯**：每个正式模型条目必须记录上游项目、模型仓库、revision（优先不可变 commit）、权重格式、量化、许可证、适用运行时、审核时间。缺少核心字段的条目只能列为“待核实”。
2. **不伪造验证**：区分 `discovered`（发现）、`metadata_verified`（已核实元数据）、`plan_validated`（脚本静态验证）、`runtime_verified`（指定设备实测）、`deprecated`（弃用）；用户手动勾选验收，只能标记为用户确认。
3. **有版本边界**：命令必须明确系统、架构、驱动/框架版本约束。不同模型的安装模板相互隔离。不要混用 LTX 与 Wan 的权重和依赖。
4. **路径安全**：自建项目脚本从脚本自身目录推导 `PROJECT_ROOT`，安装、缓存、模型、输出放在该目录下；不在父级、系统全局或写死的用户家目录创建项目环境。仅当第三方程序自身有不可避免的全局行为时，必须显式披露并提供隔离替代。
5. **最小权限**：不使用 `sudo pip`、不执行来源未知的远程 shell 脚本、不在浏览器页面收集 Hugging Face 访问令牌；脚本下载前验证域名、仓库、文件类型。
6. **可恢复**：下载中断、依赖失败、启动失败时保留已完成状态；重试不得重复破坏现有成功步骤。改模型、模型版本、运行框架、系统或硬件预算时，必须使受影响的后续验证状态失效。
7. **真实验收**：安装/下载/运行/API 分开验证，必须包含退出码、必要的文件/模型信息检查、真实推理结果；静态 GitHub Pages 不能自动执行用户终端命令，不能声称自动检查已成功。
8. **始终保持单页主线**：硬件 → 类型 → 模型 → 方案 → 安装下载 → 推理验收。新手只看本次方案，进阶内容按需展开。所有跨页链接是参考资料，不得作为已完成主线的替代品。

## 二、部署清单（推荐数据结构）

每个可发布的部署目标应有独立的机器可读 manifest，至少包含：

```json
{
  "schemaVersion": 1,
  "id": "vendor-model-variant-runtime-os",
  "source": {
    "provider": "huggingface",
    "repository": "owner/repository",
    "revision": "full-commit-sha",
    "license": "upstream-license-identifier"
  },
  "artifact": {
    "format": "safetensors",
    "precision": "fp16",
    "files": [],
    "expectedDiskBytes": null
  },
  "compatibility": {
    "os": "macos",
    "architecture": "arm64",
    "runtime": "mlx",
    "runtimeVersion": "verified-version",
    "minimumMemoryGiB": null
  },
  "validation": {
    "level": "metadata_verified",
    "hardware": null,
    "testDate": null,
    "evidence": null
  }
}
```

以上为**字段结构范例**，不是一个已经核实的真实模型。下载清单和版本必须由具体仓库元数据填充，不得猜测。

## 三、状态机和验证门槛

| 阶段 | 允许进入下一阶段的条件 | 实际证明 |
| --- | --- | --- |
| 硬件 | 已知系统、芯片/显卡、系统内存、显存（适用时）、可用空间 | 用户输入或经过明确授权的本地检测 |
| 模型 | 找到明确模型仓库与可下载版本，检查许可证和访问条件 | 元数据可追溯 |
| 方案 | 运行时兼容性检查通过，预计磁盘空间足够，给出清晰的风险等级 | 方案验证，不代表实测 |
| 下载 | 文件完整，必要时检查大小或哈希，记录版本 | 权重已获取 |
| 启动 | 依赖可导入、模型真正加载、进程稳定 | 模型加载成功 |
| 推理 | 输出非空且类型正确，产物可检查；视频必须可播放，图像必须可打开 | 真实推理成功 |
| API（可选） | 本地健康检查 + 一次完整请求响应 + 错误处理验证 | 本地服务可调用 |

用户自己执行命令的静态网站，要显示“请自行确认”，不能显示“自动验证通过”。

## 四、模型类型差异

- **语言**：推理格式、tokenizer、上下文、KV Cache、并发、量化、模型标签；验证输出文本。
- **图像**：checkpoint、VAE、text encoder、调度器、节点/工作流版本、分辨率；验证有效图片。
- **视频**：text encoder、VAE、Transformer、采样参数、时长帧率、显存峰值；验证可解码 MP4。
- **音频**：模型、采样率、音频编解码、语言能力、转录时间戳；验证正确文本或音频产物。
- **Embedding**：向量维度、归一化、池化策略、相似度度量、最大输入长度；验证向量形状与数值有效性。

## 五、软件质量门禁

每个改变部署逻辑的 Pull Request 至少满足：

- `npm ci && npm run docs:build` 成功；CI 与生产发布分开，PR 不部署生产站点。
- 界面测试覆盖前进/后退、重载恢复、切换类型后清除旧模型、错误输入、手机窄屏、键盘操作。
- 对模型筛选及部署 manifest 做单元测试，保证缺失字段、无匹配模型、版本不一致时明确失败。
- 示例命令在限定 OS/架构和版本上验证，保留测试日期与真实硬件环境；未验证只能发布为实验性。
- 新增路径遵循 VitePress `base`，不能硬编码从域名根路径跳转。
- 权重及访问密钥不得提交仓库；模型使用与许可证遵循上游要求。

## 六、参考实现和资料

- Hugging Face Hub 下载、revision 和缓存：https://huggingface.co/docs/huggingface_hub/en/guides/download
- VitePress 部署与 base 路径：https://vitepress.dev/guide/deploy
- Ollama 官方文档：https://docs.ollama.com/
- OpenAPI 规范：https://spec.openapis.org/oas/latest.html
- OWASP 软件供应链安全：https://owasp.org/www-project-software-component-verification-standard/

**实施状态**：本规范是 V2 的合并验收标准；编写规范不等于所有平台或模型已经通过验证。
