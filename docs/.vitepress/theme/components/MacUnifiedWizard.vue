<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { OLLAMA_MODELS, shortlistOllama } from '../../data/ollama-catalog.mjs'
import { videoRecommendations } from '../../data/model-video.mjs'

type Task = 'chat' | 'image' | 'video' | 'audio'
const step = ref(0)
const chip = ref('')
const memory = ref(0)
const disk = ref(0)
const task = ref<Task>('chat')
const modelId = ref('')
const confirmed = ref(false)
const status = ref('')
const tasks: { id: Task; title: string; detail: string }[] = [
  { id: 'chat', title: '语言 / 编程', detail: 'Ollama' },
  { id: 'image', title: '图像生成', detail: 'ComfyUI Desktop' },
  { id: 'video', title: '视频生成', detail: 'LTX / Wan' },
  { id: 'audio', title: '语音转文字', detail: 'whisper.cpp' }
]
const headings = ['硬件配置', '模型类型', '模型选择', '部署方案', '安装与下载', '启动与验证']
const validHardware = computed(() => chip.value !== '' && memory.value > 0 && disk.value > 0)
const suggested = computed(() => validHardware.value ? shortlistOllama({
  platform: 'mac', memoryGb: memory.value,
  systemReserveGb: Math.max(3, Math.min(8, Math.ceil(memory.value * .15)))
}).rows.filter((r: any) => r.tier !== 'over' && disk.value >= r.model.downloadGB + 2) : [])
const videos = computed(() => validHardware.value
  ? videoRecommendations({ platform: 'mac', memoryGb: memory.value, diskGb: disk.value, vramGb: 0 }) : [])
const selected = computed(() => task.value === 'chat' && suggested.value.some((r: any) => r.model.id === modelId.value) ? OLLAMA_MODELS.find((m: any) => m.id === modelId.value) : undefined)
const video = computed(() => task.value === 'video' ? videos.value.find((v: any) => v.eligible && v.model.id === modelId.value) : undefined)
const canNext = computed(() => {
  if (step.value === 0) return validHardware.value
  if (step.value >= 2) return modelOptions.value.some((m: any) => m.id === modelId.value)
  return true
})
const guide = computed(() => withBase(video.value?.model.guide || ({ chat: '/mac/chat', image: '/mac/image', video: '/mac/video', audio: '/mac/audio' })[task.value]))
const apiGuide = withBase('/mac/models/ollama')
const storageKey = 'local-ai-deploy:mac-wizard:v2'
const modelOptions = computed(() => task.value === 'chat'
  ? suggested.value.map((r: any) => ({ id: r.model.id, title: r.model.name, detail: `约 ${r.model.downloadGB} GB 下载 · 容量估算` }))
  : task.value === 'video'
    ? videos.value.filter((r: any) => r.eligible).map((r: any) => ({ id: r.model.id, title: r.model.title, detail: r.status }))
    : [{ id: task.value + '-starter', title: task.value === 'image' ? 'ComfyUI Desktop 入门工作流' : 'whisper.cpp 小模型入门', detail: '基础路线；具体模型需在原教程核对' }])
function next() {
  if (!canNext.value || step.value >= 5) return
  step.value++
  if (step.value === 2 && !modelOptions.value.some((m: any) => m.id === modelId.value)) modelId.value = ''
}
function back() { step.value = Math.max(0, step.value - 1) }
function chooseTask(value: Task) { if (task.value === value) return; task.value = value; modelId.value = ''; confirmed.value = false }
function chooseModel(value: string) { if(modelId.value === value) return; modelId.value = value; confirmed.value = false }
function reset() { step.value = 0; chip.value = ''; memory.value = 0; disk.value = 0; task.value = 'chat'; modelId.value = ''; confirmed.value = false; status.value = '' }
function copy(value: string) { if (typeof navigator === 'undefined' || !navigator.clipboard) { status.value = '当前页面无法访问剪贴板，请手动选择命令'; return } navigator.clipboard.writeText(value).then(() => status.value = '命令已复制').catch(() => status.value = '复制失败，请手动选择命令') }
watch([chip, memory, disk], () => {
  if (modelId.value && !modelOptions.value.some((m: any) => m.id === modelId.value)) { modelId.value = ''; confirmed.value = false; step.value = Math.min(step.value, 2) }
  else confirmed.value = false
})
watch([step, chip, memory, disk, task, modelId, confirmed], () => {
  if (typeof window !== 'undefined') localStorage.setItem(storageKey, JSON.stringify({
    step: step.value, chip: chip.value, memory: memory.value, disk: disk.value,
    task: task.value, modelId: modelId.value, confirmed: confirmed.value
  }))
})
onMounted(() => {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const saved = JSON.parse(raw)
      if (['M1','M2','M3','M4','M5','other'].includes(saved.chip)) chip.value = saved.chip
      if ([8,16,18,24,32,36,48,64,96,128,192,256].includes(saved.memory)) memory.value = saved.memory
      if ([10,20,30,40,60,80,100,120,160,256,512,1024].includes(saved.disk)) disk.value = saved.disk
      if (tasks.some(t => t.id === saved.task)) task.value = saved.task
      if (typeof saved.modelId === 'string') modelId.value = saved.modelId
      if (Number.isInteger(saved.step)) step.value = Math.max(0, Math.min(5, saved.step))
      confirmed.value = saved.confirmed === true
      if (!validHardware.value) step.value = 0
      else if (step.value >= 2 && !modelOptions.value.some((m: any) => m.id === modelId.value)) { modelId.value = ''; confirmed.value = false; step.value = 2 }
    }
    const q = new URLSearchParams(location.search)
    const t = q.get('task')
    if (tasks.some(x => x.id === t)) { task.value = t as Task; modelId.value = ''; step.value = 0 }
  } catch { /* Ignore invalid local state */ }
})
</script>

<template>
  <section class="unified-wizard" aria-label="Mac 单页部署向导">
    <div class="wizard-top">
      <div><p class="eyebrow">LOCAL AI DEPLOY · V2</p><h2>从电脑配置到第一次运行</h2><p>每次只完成一步，不离开当前页面。配置会保存在本浏览器中。</p></div>
      <button class="ghost" type="button" @click="reset">重新开始</button>
    </div>
    <nav class="steps" aria-label="部署进度">
      <button v-for="(title,index) in headings" :key="title" type="button" :class="{active:step===index,done:index<step}" :disabled="index>step" :aria-current="step===index?'step':undefined" @click="step=index">
        <span>{{ index + 1 }}</span><small>{{ title }}</small>
      </button>
    </nav>
    <div class="wizard-body">
      <template v-if="step===0">
        <h3>01 · 你的 Mac 硬件</h3>
        <p class="muted">打开「苹果菜单 → 关于本机」确认芯片、统一内存；在「系统设置 → 通用 → 储存空间」查看剩余空间。</p>
        <div class="fields">
          <label>Apple Silicon 芯片<select v-model="chip"><option value="">请选择</option><option v-for="c in ['M1','M2','M3','M4','M5','other']" :key="c" :value="c">{{ c==='other'?'其他 Apple Silicon':c+' 系列' }}</option></select></label>
          <label>统一内存<select v-model.number="memory"><option :value="0">请选择</option><option v-for="v in [8,16,18,24,32,36,48,64,96,128,192,256]" :key="v" :value="v">{{v}} GB</option></select></label>
          <label>可用磁盘<select v-model.number="disk"><option :value="0">请选择</option><option v-for="v in [10,20,30,40,60,80,100,120,160,256,512,1024]" :key="v" :value="v">{{v}} GB</option></select></label>
        </div>
        <p class="muted">这是手动填写，不是网站自动检测；内存容量仅用于初筛，不能证明运行性能。修改硬件信息后，之前的推理确认会失效。</p>
      </template>
      <template v-else-if="step===1">
        <h3>02 · 这次要运行什么模型？</h3>
        <div class="choices"><button v-for="t in tasks" :key="t.id" type="button" :class="{picked:task===t.id}" @click="chooseTask(t.id)"><strong>{{t.title}}</strong><small>{{t.detail}}</small></button></div>
        <p class="muted">只安装所选类型需要的软件，不会一次安装所有推理框架。</p>
      </template>
      <template v-else-if="step===2">
        <h3>03 · 选具体的部署目标</h3>
        <p class="muted">按 {{ memory }} GB 内存和 {{ disk }} GB 剩余磁盘进行容量初筛；这不是速度测试或实机兼容认证。</p>
        <div v-if="modelOptions.length" class="models"><button v-for="m in modelOptions" :key="m.id" type="button" :class="{picked:modelId===m.id}" @click="chooseModel(m.id)"><strong>{{m.title}}</strong><small>{{m.detail}}</small></button></div>
        <p v-else class="notice">当前目录没有通过容量初筛的候选。请返回修改硬件预算，或查看技术文档了解更小的模型。</p>
        <p v-if="task==='video'" class="muted">未通过视频模型参考门槛的候选已隐藏；LTX 与 Wan 的运行环境不能互相套用。</p>
      </template>
      <template v-else-if="step===3">
        <h3>04 · 本次部署方案</h3>
        <div class="summary"><strong>{{tasks.find(t=>t.id===task)?.title}}</strong><span>{{chip}} · {{memory}} GB 统一内存 · {{disk}} GB 可用磁盘</span><span>部署目标：{{selected?.name || video?.model.title || modelOptions.find(m=>m.id===modelId)?.title}}</span></div>
        <p v-if="task==='chat'">运行时：<strong>Ollama</strong>。先安装应用，再拉取所选模型，最后在终端真实提问。HTTP API 仅在运行成功后作为可选步骤。</p>
        <p v-else class="notice">这一类型目前保留已编写的专项技术教程。向导已统一硬件、类型、模型和步骤入口，但还没有把它的安装命令全部迁入单页，不能宣称一键可用。</p>
        <p class="muted">本站不会在浏览器中替你下载模型或执行终端命令，也不会把“容量符合”标记为“部署已验证”。</p>
      </template>
      <template v-else-if="step===4">
        <h3>05 · 安装和下载</h3>
        <template v-if="task==='chat' && selected">
          <p>① 从 <a href="https://ollama.com/download/mac" target="_blank" rel="noopener noreferrer">Ollama macOS 官方页面</a>安装并启动应用。</p>
          <p>② 终端确认安装：</p><div class="command"><code>ollama --version</code><button type="button" @click="copy('ollama --version')">复制</button></div>
          <p>③ 下载当前模型：</p><div class="command"><code>ollama pull {{selected.tag}}</code><button type="button" @click="copy('ollama pull '+selected.tag)">复制</button></div>
          <p>④ 检查模型：</p><div class="command"><code>ollama list</code><button type="button" @click="copy('ollama list')">复制</button></div>
          <p class="muted">下载完成并不代表推理成功；请继续下一步验证。</p>
        </template>
        <template v-else>
          <p class="notice">此类模型的完整依赖安装和下载操作尚未迁入新版向导。为避免提供不完整或错误命令，请按保留的专项教程执行。</p>
          <a :href="guide" class="secondary-link">查看{{tasks.find(t=>t.id===task)?.title}}的完整原教程 →</a>
        </template>
      </template>
      <template v-else>
        <h3>06 · 启动与真实验证</h3>
        <template v-if="task==='chat' && selected">
          <p>在终端运行模型，输入「请用三句话介绍本地 AI」，收到实际回答后才算通过。</p>
          <div class="command"><code>ollama run {{selected.tag}}</code><button type="button" @click="copy('ollama run '+selected.tag)">复制</button></div>
          <p>输入 <code>/bye</code> 退出。不要把服务启动或模型下载完成误认为推理成功。</p>
          <label class="check"><input v-model="confirmed" type="checkbox"> 我已经在本机收到模型的实际回答</label>
          <p v-if="confirmed" class="success">已由你确认本机推理成功。网站未远程核验此结果。</p>
          <details><summary>可选：从 Java 或其他程序使用 HTTP API</summary><p>Ollama 服务运行后可以用以下命令检查本地接口（不是独立的安装步骤）：</p><div class="command"><code>curl http://127.0.0.1:11434/api/tags</code><button type="button" @click="copy('curl http://127.0.0.1:11434/api/tags')">复制</button></div><p>响应模型列表后，可进一步阅读 <a :href="apiGuide">Ollama API 进阶说明</a>。</p></details>
        </template>
        <template v-else><p class="notice">请先完成专项教程中的真实图片、MP4 或文字转录验收。此类型尚未接入 V2 的可核验单页步骤。</p><a :href="guide" class="secondary-link">打开原有完整验证教程 →</a></template>
      </template>
    </div>
    <p v-if="status" class="muted" role="status">{{status}}</p>
    <div class="wizard-actions"><button type="button" class="ghost" :disabled="step===0" @click="back">← 上一步</button><span>{{step+1}} / 6</span><button v-if="step<5" type="button" class="primary" :disabled="!canNext" @click="next">下一步 →</button><span v-else>已到最后一步</span></div>
  </section>
</template>

<style scoped>
.unified-wizard{border:1px solid var(--vp-c-divider);border-radius:18px;overflow:hidden;margin:1.4rem 0 2rem;background:var(--vp-c-bg)}
.wizard-top{padding:1.5rem;display:flex;justify-content:space-between;align-items:start;gap:1rem;background:var(--vp-c-bg-soft)}
.wizard-top h2{margin:.2rem 0;border:0;padding:0;font-size:1.4rem}.wizard-top p{margin:.25rem 0;color:var(--vp-c-text-2);font-size:.9rem}.eyebrow{font-size:.7rem!important;letter-spacing:.1em;color:var(--vp-c-brand-1)!important;font-weight:700}
.steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border-bottom:1px solid var(--vp-c-divider)}
.steps button{display:grid;justify-items:center;gap:.3rem;padding:.85rem .2rem;border-bottom:3px solid transparent;color:var(--vp-c-text-2)}
.steps button span{display:grid;place-items:center;width:27px;height:27px;border-radius:50%;background:var(--vp-c-bg-soft);font-weight:700}.steps button small{font-size:.7rem}
.steps button.active{border-bottom-color:var(--vp-c-brand-1);color:var(--vp-c-brand-1)}.steps button.done span{background:var(--vp-c-brand-soft);color:var(--vp-c-brand-1)}
.steps button:disabled{cursor:default;opacity:.65}.wizard-body{padding:1.5rem;min-height:265px}.wizard-body h3{margin:0 0 1rem;font-size:1.15rem}
.fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem}.fields label{display:grid;gap:.4rem;font-weight:600;font-size:.85rem}
.fields select{width:100%;min-width:0;padding:.7rem;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg-soft);border-radius:9px;color:var(--vp-c-text-1)}
.muted{color:var(--vp-c-text-2);font-size:.84rem;line-height:1.7}.choices,.models{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem}
.choices button,.models button{text-align:left;display:grid;gap:.3rem;padding:1rem;border:1px solid var(--vp-c-divider);border-radius:10px;background:var(--vp-c-bg-soft)}
.choices button.picked,.models button.picked{border-color:var(--vp-c-brand-1);background:var(--vp-c-brand-soft)}.choices small,.models small{color:var(--vp-c-text-2)}
.notice{padding:1rem;background:var(--vp-c-bg-soft);border:1px solid var(--vp-c-divider);border-radius:9px}.summary{display:grid;gap:.5rem;padding:1rem;background:var(--vp-c-bg-soft);border-radius:10px}
.command{display:flex;gap:.7rem;justify-content:space-between;align-items:center;padding:.8rem;border-radius:9px;background:var(--vp-code-block-bg);overflow:auto;margin:.5rem 0 1rem}.command code{white-space:nowrap}.command button{flex:none;color:var(--vp-c-brand-1);font-weight:600}
.check{display:flex;gap:.5rem;align-items:center;margin:1.2rem 0}.success{color:var(--vp-c-brand-1);font-weight:600}
.wizard-actions{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;border-top:1px solid var(--vp-c-divider)}.wizard-actions button,.ghost{border-radius:8px;padding:.6rem .9rem;border:1px solid var(--vp-c-divider)}.wizard-actions .primary{background:var(--vp-c-brand-1);color:#fff;border-color:transparent}.wizard-actions button:disabled{opacity:.4;cursor:not-allowed}
.secondary-link{display:inline-block;margin:.5rem 0;font-weight:600}
@media(max-width:650px){.steps button small{font-size:.58rem}.wizard-top{flex-direction:column}.fields,.choices,.models{grid-template-columns:1fr}.wizard-body{padding:1rem}}
</style>
