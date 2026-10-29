<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { macModels, type MacTask } from '../../data/mac-models'

const chip = ref('M4')
const memory = ref(32)
const task = ref<MacTask>('video')
const matching = computed(() => macModels
  .filter(x => x.task === task.value && x.minMemoryGb <= memory.value)
  .sort((a, b) => b.minMemoryGb - a.minMemoryGb))
const higher = computed(() => macModels
  .filter(x => x.task === task.value && x.minMemoryGb > memory.value))
</script>

<template>
  <section class="mac-advisor">
    <p class="caveat">本工具只按人工维护的参考配置筛选候选，不会自动检测设备，也不保证模型能运行。芯片代际不直接等于模型兼容性，仍要以实际运行时、权重格式和推理结果为准。</p>
    <div class="form-grid">
      <label>芯片系列
        <select v-model="chip">
          <option v-for="c in ['M1', 'M2', 'M3', 'M4', 'M5']" :key="c" :value="c">{{ c }} 系列</option>
        </select>
      </label>
      <label>统一内存
        <select v-model.number="memory">
          <option v-for="size in [8, 16, 24, 32, 48, 64, 96, 128]" :key="size" :value="size">{{ size }} GB{{ size === 128 ? '+' : '' }}</option>
        </select>
      </label>
      <label>模型用途
        <select v-model="task">
          <option value="llm">大语言模型</option>
          <option value="video">视频生成</option>
          <option value="image">图像生成</option>
          <option value="audio">语音识别</option>
        </select>
      </label>
    </div>
    <p class="context">选择：<strong>{{ chip }} · {{ memory }} GB</strong>。更换芯片会改变性能和部分后端兼容性判断，但当前没有足够逐芯片实测数据进行自动排除。</p>
    <h2>初步符合参考内存门槛（{{ matching.length }}）</h2>
    <p v-if="!matching.length">当前目录暂未列出符合该筛选条件的模型，不代表这台 Mac 无法运行其他优化版本。</p>
    <div class="cards">
      <article v-for="item in matching" :key="item.id" class="candidate">
        <div class="name-row">
          <strong>{{ item.title }}</strong>
          <span class="evidence">{{ item.verification }}</span>
        </div>
        <p class="meta">{{ item.engine }} · 参考门槛 ≥{{ item.minMemoryGb }} GB</p>
        <p>{{ item.description }}</p>
        <div class="links">
          <a :href="withBase(item.guide)">阅读步骤</a>
          <a :href="item.source" target="_blank" rel="noopener noreferrer">查看来源</a>
        </div>
      </article>
    </div>
    <details v-if="higher.length" class="extra">
      <summary>超出当前参考内存门槛的候选（{{ higher.length }}）</summary>
      <ul>
        <li v-for="item in higher" :key="item.id">{{ item.title }}：参考起点 ≥{{ item.minMemoryGb }} GB</li>
      </ul>
    </details>
    <p class="context">所有数值均为粗筛参考，并非官方最低要求。视频帧数、分辨率、上下文长度、量化方案和推理框架会显著影响实际占用。</p>
  </section>
</template>

<style scoped>
.mac-advisor { margin: 1.5rem 0 2rem; }
.caveat { border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 1rem; background: var(--vp-c-bg-soft); }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(165px, 1fr)); gap: 1rem; margin: 1.4rem 0; }
.form-grid label { display: grid; gap: .4rem; font-size: .9rem; font-weight: 600; }
.form-grid select { padding: .7rem; border-radius: 9px; border: 1px solid var(--vp-c-divider); color: var(--vp-c-text-1); background: var(--vp-c-bg); }
.context, .meta { color: var(--vp-c-text-2); font-size: .89rem; }
.cards { display: grid; grid-template-columns: repeat(auto-fit,minmax(min(100%,290px),1fr)); gap: 1rem; margin: 1rem 0; }
.candidate { padding: 1.1rem; border: 1px solid var(--vp-c-divider); border-radius: 14px; }
.name-row { display: flex; justify-content: space-between; flex-wrap: wrap; gap: .6rem; }
.evidence { font-size: .72rem; padding: .2rem .55rem; border: 1px solid var(--vp-c-divider); border-radius: 99px; }
.candidate p { margin: .6rem 0; }
.links { display: flex; flex-wrap: wrap; gap: 1rem; font-size: .85rem; }
.extra { margin: 1.3rem 0; padding: .85rem; border: 1px solid var(--vp-c-divider); border-radius: 10px; }
.extra summary { cursor: pointer; }
</style>
