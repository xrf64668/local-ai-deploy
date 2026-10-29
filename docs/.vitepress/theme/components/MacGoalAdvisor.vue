<script setup>
import {computed,ref,onMounted} from 'vue'
import {withBase} from 'vitepress'
import {OLLAMA_MODELS,shortlistOllama} from '../../data/ollama-catalog.mjs'
import {videoRecommendations} from '../../data/model-video.mjs'

const chip=ref('')
const memory=ref(0)
const disk=ref(0)
const task=ref('')
onMounted(()=>{const t=new URLSearchParams(window.location.search).get('task');if(['chat','image','video','audio'].includes(t))task.value=t})
const tasks=[
 {id:'chat',icon:'Aa',name:'语言大模型',desc:'本地聊天、编程、文档问答',tools:'Ollama · GGUF'},
 {id:'image',icon:'▧',name:'图像生成',desc:'文字生成图片、图片编辑',tools:'ComfyUI · MPS'},
 {id:'video',icon:'▶',name:'视频生成',desc:'文字生成视频、图生视频',tools:'LTX / Wan · MLX'},
 {id:'audio',icon:'♫',name:'语音识别',desc:'录音转文字、制作字幕',tools:'Whisper · GGML'}
]
const basicReady=computed(()=>chip.value!==''&&memory.value>0&&disk.value>0)
const chosen=computed(()=>tasks.find(x=>x.id===task.value))
const llmCandidates=computed(()=>{
 if(!basicReady.value||task.value!=='chat')return []
 const shortlist=shortlistOllama({platform:'mac',memoryGb:memory.value,systemReserveGb:Math.max(3,Math.min(8,Math.ceil(memory.value*.15)))})
 const ids=['q3','q7','llama','q35','g4','q38','oss','d14']
 return ids.map(id=>shortlist.rows.find(x=>x.model.id===id))
   .filter(x=>x&&x.tier!=='over'&&disk.value>=x.model.downloadGB+2)
   .slice(0,4)
})
const videoCandidates=computed(()=>basicReady.value&&task.value==='video'
 ?videoRecommendations({platform:'mac',memoryGb:memory.value,diskGb:disk.value,vramGb:0})
 :[])
const taskGuide=computed(()=>({chat:'/mac/chat',image:'/mac/image',video:'/mac/video',audio:'/mac/audio'})[task.value]||'/mac/')
const query=(extra={})=>new URLSearchParams({chip:chip.value,memory:String(memory.value),disk:String(disk.value),...extra}).toString()
const modelLink=(id)=>withBase('/mac/chat?'+query({model:id}))
const videoLink=(row)=>withBase(row.model.guide+'?'+query({model:row.model.id}))
const guideLink=computed(()=>withBase(taskGuide.value+'?'+query()))
const requiredMemory=computed(()=>{
 if(task.value==='video')return '视频模型通常需要更多统一内存及额外的下载空间；这里按已收录模型的参考门槛逐项判断。'
 if(task.value==='image')return 'ComfyUI 在 Mac 上通常通过 MPS 运行，具体模型的内存占用还取决于工作流、分辨率与精度。'
 if(task.value==='audio')return '先从较小的 Whisper GGML 模型做语音识别，不需要下载视频模型。'
 return '语言模型先从轻量量化权重开始。这里是容量初筛，不是模型质量或运行速度排名。'
})
</script>

<template>
 <section class="mac-path-advisor">
  <div class="step-heading">
   <span class="number">01</span>
   <div><h2>先选择你使用的 Mac</h2><p>在「苹果菜单 → 关于本机」可查看芯片和统一内存；磁盘剩余空间可到「系统设置 → 通用 → 储存空间」查看。</p></div>
  </div>
  <div class="hardware-grid">
   <label>芯片系列
    <select v-model="chip"><option value="">选择芯片</option><option v-for="name in ['M1','M2','M3','M4','M5']" :key="name" :value="name">{{name}} 系列</option><option value="other">其他 Apple Silicon</option></select>
   </label>
   <label>统一内存
    <select v-model.number="memory"><option :value="0">选择内存</option><option v-for="n in [8,16,18,24,32,36,48,64,96,128,192,256]" :key="n" :value="n">{{n}} GB</option></select>
   </label>
   <label>当前可用磁盘
    <select v-model.number="disk"><option :value="0">选择剩余空间</option><option v-for="n in [10,20,30,40,60,80,100,120,160,256,512,1024]" :key="n" :value="n">{{n}} GB</option></select>
   </label>
  </div>
  <p class="footnote">本站不会读取或检测你的硬件；以上只作为本次页面的参考输入。M 系列同名芯片的 CPU/GPU 规格也可能不同；计算只初筛容量，不预测运行速度。</p>
  <div class="step-heading">
   <span class="number">02</span>
   <div><h2>再选择你想完成的事情</h2><p>四种模型需要的工具不同，不必都安装。</p></div>
  </div>
  <div class="goal-grid">
   <button v-for="item in tasks" :key="item.id" type="button" class="goal-card"
     :class="{selected:task===item.id}" :aria-pressed="task===item.id" @click="task=item.id">
    <span class="goal-symbol" aria-hidden="true">{{item.icon}}</span>
    <strong>{{item.name}}</strong>
    <span>{{item.desc}}</span>
    <small>{{item.tools}}</small>
   </button>
  </div>
  <div class="step-heading">
   <span class="number">03</span>
   <div><h2>只查看这一类的部署建议</h2><p>根据你刚才选择的目标和设备，显示对应步骤与参考候选。</p></div>
  </div>
  <div v-if="!basicReady||!task" class="empty-state">
   <strong>先完成上面的选择</strong>
   <p>选择芯片、内存、磁盘以及模型类型后，这里才会显示对应的路线，不会预先套用他人的 M4/32GB 测试环境。</p>
  </div>
  <div v-else class="advice-panel" aria-live="polite">
   <p class="selected-config">当前选择：{{chip==='other'?'Apple Silicon':chip}} · {{memory}}GB 统一内存 · {{disk}}GB 可用磁盘 · {{chosen?.name}}</p>
   <h3>推荐先走：{{chosen?.name}}专属路线</h3>
   <p>{{requiredMemory}}</p>
   <template v-if="task==='chat'">
    <h4>符合容量初筛的示例模型</h4>
    <div v-if="llmCandidates.length" class="mini-list">
     <div v-for="row in llmCandidates" :key="row.model.id" class="mini-item">
      <span><strong>{{row.model.name}}</strong><small>下载约 {{row.model.downloadGB}}GB · 规划约 {{row.planningGiB}}GiB</small></span>
      <a  :href="modelLink(row.model.id)">直接进入下载与运行步骤 →</a>
     </div>
    </div>
    <p v-else class="caution">目前目录没有适合这组内存/磁盘预算的候选，请优先查看轻量量化模型或释放磁盘空间。</p>
    <p class="fine">这些是 Ollama 标签的跨架构容量初筛，不能当成速度、准确率或特定任务的实测排名。</p>
   </template>
   <template v-else-if="task==='video'">
    <h4>各视频模型分开判断</h4>
    <div class="mini-list">
     <div v-for="row in videoCandidates" :key="row.model.id" class="mini-item video">
      <span><strong>{{row.model.title}}</strong><small>{{row.status}} · 下载 {{row.model.download}}</small><small v-if="!row.eligible">{{row.reasons.join('；')}}</small></span>
      <a v-if="row.eligible" :href="videoLink(row)">直接开始这个模型 →</a>
      <span v-else class="disabled-note">暂不推荐下载</span>
     </div>
    </div>
    <p class="fine">达到参考门槛只代表值得尝试；不代表能稳定生成。不要把 LTX 的依赖、权重、命令直接用到 Wan。</p>
   </template>
   <template v-else-if="task==='image'">
    <p>从 <strong>ComfyUI Desktop</strong> 开始：先安装图形界面，再选官方工作流模板，按模板下载对应权重，最后生成第一张图片。无需先安装 LTX 或 Ollama。</p>
    <p class="fine">这里不根据统一内存直接承诺某个 FLUX/SDXL 工作流一定可用；分辨率、精度与节点会明显影响占用。</p>
   </template>
   <template v-else>
    <p>先安装独立的 <strong>whisper.cpp</strong>，下载较小的 GGML 语音模型，再将你自己的音频转换为所需格式并转写。此路线不需要 Ollama、ComfyUI 或视频模型。</p>
   </template>
   <a v-if="task==='image'||task==='audio'||(task==='chat'&&!llmCandidates.length)" :href="guideLink" class="primary-link">继续按步骤安装{{chosen?.name}} →</a>
  </div>
 </section>
</template>

<style scoped>
.mac-path-advisor{margin:1.5rem 0 2.5rem}
.step-heading{display:flex;gap:.85rem;align-items:flex-start;margin:2.2rem 0 1rem}
.step-heading .number{flex:none;display:grid;place-items:center;width:2.15rem;height:2.15rem;border:1px solid var(--vp-c-brand-soft);border-radius:10px;background:var(--vp-c-brand-soft);color:var(--vp-c-brand-1);font-weight:700;font-size:.9rem}
.step-heading h2{font-size:1.3rem;margin:0;line-height:1.6;border:0;padding:0}
.step-heading p{color:var(--vp-c-text-2);font-size:.87rem;margin:.15rem 0 0}
.hardware-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.85rem}
.hardware-grid label{display:grid;gap:.4rem;font-size:.88rem;font-weight:600}
.hardware-grid select{width:100%;min-width:0;background:var(--vp-c-bg-soft);color:var(--vp-c-text-1);padding:.75rem;border:1px solid var(--vp-c-divider);border-radius:9px}
.footnote,.fine{font-size:.82rem;color:var(--vp-c-text-2);line-height:1.7}
.goal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}
.goal-card{text-align:left;display:flex;flex-direction:column;align-items:flex-start;gap:.27rem;padding:1rem 1.1rem;border:1px solid var(--vp-c-divider);border-radius:12px;background:var(--vp-c-bg-soft);color:var(--vp-c-text-1);cursor:pointer;transition:border-color .15s}
.goal-card:hover,.goal-card:focus-visible,.goal-card.selected{border-color:var(--vp-c-brand-1);outline-offset:2px}
.goal-card.selected{background:var(--vp-c-brand-soft)}
.goal-symbol{font-size:1.25rem;color:var(--vp-c-brand-1);font-weight:700}
.goal-card strong{font-size:1rem}.goal-card span:not(.goal-symbol){font-size:.86rem;color:var(--vp-c-text-2)}
.goal-card small{font-size:.75rem;color:var(--vp-c-text-3);margin-top:.3rem}
.empty-state,.advice-panel{padding:1.15rem;border:1px solid var(--vp-c-divider);border-radius:12px;background:var(--vp-c-bg-soft)}
.empty-state p,.advice-panel p{margin:.45rem 0;color:var(--vp-c-text-2);font-size:.9rem}
.advice-panel h3{margin:.8rem 0 .4rem;font-size:1.12rem}.advice-panel h4{margin:1rem 0 .6rem}
.selected-config{font-size:.85rem!important;color:var(--vp-c-brand-1)!important}
.mini-list{display:grid;gap:.5rem;margin:.6rem 0}.mini-item{display:flex;justify-content:space-between;align-items:center;gap:.8rem;padding:.8rem;border-radius:8px;background:var(--vp-c-bg);border:1px solid var(--vp-c-divider)}
.mini-item>span:first-child{display:flex;flex-direction:column;gap:.18rem}.mini-item strong{font-size:.9rem}.mini-item small{font-size:.78rem;color:var(--vp-c-text-2)}
.mini-item a,.primary-link{font-weight:600;font-size:.86rem;white-space:nowrap}.disabled-note{font-size:.78rem;color:var(--vp-c-text-3)}
.primary-link{display:inline-flex;margin-top:.9rem;padding:.65rem 1rem;background:var(--vp-c-brand-1);border-radius:8px;color:white!important;text-decoration:none}
@media(max-width:650px){.hardware-grid{grid-template-columns:1fr}.goal-grid{grid-template-columns:1fr}.mini-item{flex-direction:column;align-items:flex-start}.primary-link{white-space:normal}}
</style>