# 模型容量计算与部署建议

**计算面板就在下面。** 请先选 Mac、Ubuntu 或 Windows，再选择模型类型，填写自己的内存、显存和磁盘条件，页面会根据配置更新候选模型和容量预算。

::: tip 第一次来这里？
如果只想快速找到对应的部署流程，可以先去 [Mac 按配置选模型](/mac/)、[Linux 按显存选模型](/ubuntu/) 或 [Windows 按显存选模型](/windows/)；不必先学习 KV 缓存和量化计算公式。
:::

## 交互式硬件容量计算器

<ClientOnly>
  <ModelAdvisor />
  <template #fallback>
    <div class="calculator-load-fallback">
      <strong>正在加载交互式计算面板…</strong>
      <p>如果此提示一直存在，请刷新页面，并确认浏览器允许本站运行 JavaScript。也可以先使用下面对应系统的设备选型入口。</p>
      <p><a href="/local-ai-deploy/mac/">Mac 选型</a> · <a href="/local-ai-deploy/ubuntu/">Linux 选型</a> · <a href="/local-ai-deploy/windows/">Windows 选型</a></p>
    </div>
  </template>
</ClientOnly>

::: details 进阶：计算依据、适用边界与结果解释
- **语言模型：** 使用真实 Ollama 模型标签的公开下载量、上下文和保护性工作区余量进行容量初筛；传统 Qwen2.5 Transformer 还能展开查看权重、KV 缓存的详细估算。
- **视频模型：** 按系统、统一内存/显存及磁盘空间筛选当前收录的 LTX/Wan 等部署候选，不使用语言模型公式假造视频峰值。
- **图像与语音：** 优先引导到对应系统的实际工作流和安装教程；没有具体权重及参数时不声称已经精确测出内存需求。

**这不是自动检测硬件，也不是实机性能测试。** 容量达到初筛条件只是值得进一步验证，仍要核对模型来源、量化格式、许可证、驱动、运行时和实际输出。
:::

## 计算结果应该怎么用？

1. 先看估算总量是否超过自己的可用内存或显存预算，接近上限时选择更轻的方案。
2. 对照实际模型文件、运行时和下载渠道，不要把不同量化或不同转换格式混用。
3. 完成第一次真实推理，记录实际资源峰值、耗时和输出文件。

[查看计算公式与数据来源](/recommend/how-it-works) · [搜索官方模型仓库](/guide/model-search) · [按设备生成下载命令](/guide/deploy)
