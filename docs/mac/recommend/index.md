# Mac · Apple Silicon 模型容量计算

**计算面板就在下面。** 选择芯片、统一内存、模型任务、量化和上下文，查看自己这台 Mac 的容量预算和具体模型候选。

如果只是想找独立的安装教程，可以直接进入 [Mac 配置与模型类型选择](/mac/)。

## Mac 交互式容量计算器


::: details 计算面板没有显示？点击查看
计算器应该显示在本段说明的**正下方**。如果这里只有空白，可能是浏览器缓存了旧版脚本、网络加载失败，或浏览器扩展影响了脚本。

建议先按 **Mac：⌘ + Shift + R**、**Windows/Linux：Ctrl + Shift + R** 强制刷新。如果仍然空白，换一个浏览器窗口或暂时禁用可能干扰网页的扩展，再重新打开此页面。

也可以先从下面的入口选自己的设备，不影响继续学习：
- [Mac：按硬件选择模型](/mac/)
- [Ubuntu / Linux：按 NVIDIA 显存选择模型](/ubuntu/)
- [Windows：按 NVIDIA 显存选择模型](/windows/)

如果持续无法加载，欢迎到 [GitHub Issues](https://github.com/xrf64668/local-ai-deploy/issues/new) 反馈浏览器版本和截图（请不要上传私人路径或密钥）。
:::

<MacModelAdvisor />


::: details 进阶：计算结果与真实部署的区别
容量计算会筛选 Qwen3.8、Gemma、DeepSeek、gpt-oss、Llama、Mistral 等模型；Qwen2.5 的传统 Transformer 权重和 KV 缓存估算可以进一步展开。

选择视频模型时，根据当前参考条件显示 LTX-2.3 Q4、LTX-2.5 Q4 或 Wan2.2 Q8，但**实际视频内存峰值与能否生成仍受分辨率、帧数、运行时及权重版本影响**，不能仅凭预算判断成功。
:::

[公式与误差说明](/recommend/how-it-works) · [Mac 从配置选择模型](/mac/) · [模型下载教程](/guide/model-download)
