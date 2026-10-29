# Mac · Apple Silicon 模型容量计算

**计算面板就在下面。** 选择芯片、统一内存、模型任务、量化和上下文，查看自己这台 Mac 的容量预算和具体模型候选。

如果只是想找独立的安装教程，可以直接进入 [Mac 配置与模型类型选择](/mac/)。

## Mac 交互式容量计算器

<ClientOnly>
  <MacModelAdvisor />
  <template #fallback>
    <div class="calculator-load-fallback">
      <strong>正在加载 Mac 模型容量计算器…</strong>
      <p>如果此提示一直存在，请刷新页面，并检查浏览器是否禁用了本站的 JavaScript。</p>
      <p><a href="/local-ai-deploy/mac/">打开 Mac 配置与模型类型选择 →</a></p>
    </div>
  </template>
</ClientOnly>

::: details 进阶：计算结果与真实部署的区别
容量计算会筛选 Qwen3.8、Gemma、DeepSeek、gpt-oss、Llama、Mistral 等模型；Qwen2.5 的传统 Transformer 权重和 KV 缓存估算可以进一步展开。

选择视频模型时，根据当前参考条件显示 LTX-2.3 Q4、LTX-2.5 Q4 或 Wan2.2 Q8，但**实际视频内存峰值与能否生成仍受分辨率、帧数、运行时及权重版本影响**，不能仅凭预算判断成功。
:::

[公式与误差说明](/recommend/how-it-works) · [Mac 从配置选择模型](/mac/) · [模型下载教程](/guide/model-download)
