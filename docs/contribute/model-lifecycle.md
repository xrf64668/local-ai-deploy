# 模型库自动发现与实测数据维护

本站使用 GitHub Pages 静态发布。模型数据分为 **发现 / 审核 / 估算 / 社区实测 / 可重复验证** 五层，避免把搜索结果当成已兼容模型。

## 当前自动化（已实现）

仓库的 `.github/workflows/model-discovery.yml` 以 **每周一 06:19 UTC** 定时运行，也支持手动触发；工作流只读取 Hugging Face Hub 的**公开模型元数据**，不会下载几十 GB 的权重，也不会运行模型或自动提交到 `main`。

检查清单见 `data/model-discovery/watchlist.json`。Node 22 脚本 `scripts/model-discovery.mjs` 会对指定仓库及关键词进行发现，读取仓库 revision、许可证字段、是否受限、文件名与格式线索，写入 `artifacts/model-discovery.json`，由 Actions 保留 21 天供审核。

本地在网站仓库根目录运行：

```bash
node --test tests/model-discovery.test.mjs
node scripts/model-discovery.mjs
```

**成功标志：** `artifacts/model-discovery.json` 出现候选、revision、来源及错误字段。文件包含 `reviewStatus: discovered`、`hardwareVerified: false`；即使有 .safetensors、.gguf，也不能直接变为硬件推荐。

[查看 GitHub Actions](https://github.com/xrf64668/local-ai-deploy/actions/workflows/model-discovery.yml)

## 审核与入库（下一阶段）

1. **发现**：从模型开发者、Hugging Face、Ollama 和 ModelScope 的实际记录中发现候选。当前自动任务只接入 Hugging Face；其他渠道需另建适配器。
2. **核验**：核对模型许可证、官方源与转换仓库的关联、精确权重文件名、量化形式、所需附属文件及运行时版本。
3. **审核 PR**：将核验完成的模型资料作为拉取请求合入正式推荐目录。**不允许直接将自动发现记录标为“已验证”**。
4. **构建**：重新运行模型数据测试、VitePress 构建和浏览器交互检查；合并后由现有 Pages 工作流部署。
5. **过期检查**：若上游 revision 更新，重新评估下载步骤和模型占用；旧实测仍绑定旧 revision，不能泛化给新权重。

## 收集真实设备结果（已提供投稿入口）

邀请读者通过 [提交本地模型实测记录](https://github.com/xrf64668/local-ai-deploy/issues/new?template=model-benchmark.yml) 自愿提交脱敏报告。

至少包含：系统/芯片或显卡、统一内存或显存、**模型仓库及精确 revision**、推理框架 Commit、量化、具体生成参数、成功/失败、耗时与资源峰值（若真实测得）。

**本站不能通过网页自动运行访客电脑上的模型。** 如希望自动采样，需要读者主动安装、运行本地只读检测/基准工具、审阅收集内容并同意上传；不能把浏览器表单伪装成已获取真实显存峰值。

## 如何区分证据等级

| 状态 | 能确认什么 | 是否可作为真实兼容性结论 |
| --- | --- | --- |
| discovered | 上游公开仓库存在 | 否 |
| reviewed | 文件、许可、运行时已人工核对 | 否 |
| estimated | 当前设备预算达到容量初筛条件 | 否 |
| self_reported | 读者报告生成成功/失败 | 仅展示“社区自报” |
| reproduced | 相同配置有完整复现步骤和证据、通过审核 | 可在限定硬件/版本/参数范围展示 |

**不要把作者测试过的一台电脑当作所有访客的硬件基线**。每次适配判断都必须以访客实际选择的机器参数为条件。Windows、Ubuntu 的 CPU Offload 与 Mac 统一内存不可套用同一个实际显存峰值。

## 安全边界

不执行上游仓库中的不可信代码；自动发现只读取公开 JSON 元数据。未审核的模型描述、链接和文件名必须视为外部输入。不得自动下载或运行社区代码，不得把访问密钥或 GitHub Token 输出到客户端或模型记录。

下一步适合增加：自动生成待审核 PR、ModelScope/Ollama 正式适配器、机器可读的运行记录校验器、在页面展示统计样本数与不同设备条件下的成功率。
