<script setup lang="ts">
import { computed, ref } from 'vue'
import { modelCatalog, type Platform, type Task } from '../../data/models'

const platform = ref<Platform>('mac')
const task = ref<Task>('video')
const memoryGb = ref(32)
const vramGb = ref(8)

const available = computed(() => modelCatalog.filter(model =>
  model.platform === platform.value && model.task === task.value &&
  memoryGb.value >= model.minimumMemoryGb &&
  (platform.value === 'mac' || vramGb.value >= (model.minimumVramGb ?? 0))
))
</script>

<template>
  <div class="model-advisor">
    <p class="warning">这是一份可维护的入门筛选器，展示参考配置，不会自动检测你的硬件，也不保证模型在所选机器上可运行。</p>
    <div class="selectors">
      <label>运行平台
        <select v-model="platform">
          <option value="mac">Mac · Apple Silicon</option>
          <option value="ubuntu">Ubuntu · NVIDIA</option>
          <option value="windows">Windows · NVIDIA</option>
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
      <label>{{ platform === 'mac' ? '统一内存' : '系统内存' }}
        <select v-model.number="memoryGb">
          <option :value="8">8 GB</option>
          <option :value="16">16 GB</option>
          <option :value="24">24 GB</option>
          <option :value="32">32 GB</option>
          <option :value="48">48 GB</option>
          <option :value="64">64 GB</option>
          <option :value="128">128 GB+</option>
        </select>
      </label>
      <label v-if="platform !== 'mac'">NVIDIA GPU 显存
        <select v-model.number="vramGb">
          <option :value="0">无独立 GPU</option>
          <option :value="4">4 GB</option>
          <option :value="6">6 GB</option>
          <option :value="8">8 GB</option>
          <option :value="12">12 GB</option>
          <option :value="16">16 GB</option>
          <option :value="24">24 GB</option>
          <option :value="32">32 GB</option>
          <option :value="48">48 GB</option>
          <option :value="64">64 GB+</option>
        </select>
      </label>
    </div>
    <h2>初步筛选结果（{{ available.length }}）</h2>
    <p v-if="!available.length">当前示例目录没有匹配项；不代表你的机器无法运行其他模型或低内存优化方案。</p>
    <div v-else class="results">
      <article v-for="model in available" :key="model.id" class="result">
        <div class="result-heading">
          <strong>{{ model.name }}</strong>
          <span class="confidence">{{ model.confidence }}</span>
        </div>
        <p>运行工具：{{ model.engine }}</p>
        <p>{{ model.detail }}</p>
        <a :href="model.source" target="_blank" rel="noopener noreferrer">模型或框架来源</a>
      </article>
    </div>
    <p class="footnote">门槛为初步参考估算，并非实测性能承诺；模型版本、量化、显存分配和分辨率等都会改变结果。未来将逐条补充实测环境、测评日期和可复现命令。</p>
  </div>
</template>

<style scoped>
.model-advisor { margin: 1rem 0 2rem; }
.warning { padding: .85rem 1rem; border: 1px solid var(--vp-c-divider); border-radius: 10px; }
.selectors { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
.selectors label { display: grid; gap: .45rem; font-weight: 600; font-size: .94rem; }
.selectors select { width: 100%; padding: .7rem; color: var(--vp-c-text-1); background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 8px; }
.results { display: grid; gap: 1rem; }
.result { border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 1rem 1.15rem; }
.result-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem; }
.confidence { font-size: .78rem; color: var(--vp-c-text-2); border: 1px solid var(--vp-c-divider); border-radius: 99px; padding: .2rem .6rem; }
.result p { margin: .5rem 0; }
.footnote { color: var(--vp-c-text-2); font-size: .85rem; margin-top: 1.25rem; }
</style>
