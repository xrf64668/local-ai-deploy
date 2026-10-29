<script setup>
import {computed,ref,onMounted} from 'vue'
import {withBase} from 'vitepress'
import {shortlistOllama} from '../../data/ollama-catalog.mjs'
import {videoRecommendations} from '../../data/model-video.mjs'

const props=defineProps({platform:{type:String,required:true,validator:x=>['ubuntu','windows'].includes(x)}})
const systemRam=ref(0)
const vram=ref(-1)
const disk=ref(0)
const purpose=ref('')
onMounted(()=>{const t=new URLSearchParams(window.location.search).get('task');if(['chat','image','video','audio'].includes(t))purpose.value=t})
const categoryOptions=[
 {id:'chat',mark:'Aa',title:'语言模型',desc:'聊天、编程、文档问答',backend:'Ollama'},
 {id:'image',mark:'▧',title:'图像模型',desc:'文生图、图像编辑',backend:'ComfyUI + CUDA'},
 {id:'video',mark:'▶',title:'视频模型',desc:'文字或图片生成视频',backend:'LTX / Wan + CUDA'},
 {id:'audio',mark:'♫',title:'语音识别',desc:'录音转文字、生成字幕',backend:'whisper.cpp'}
]
const label=computed(()=>props.platform==='ubuntu'?'Ubuntu / NVIDIA':'Windows / NVIDIA')
const filled=computed(()=>systemRam.value>0&&vram.value>=0&&disk.value>0)
const choice=computed(()=>categoryOptions.find(x=>x.id===purpose.value))
const link=computed(()=>withBase('/'+props.platform+'/'+purpose.value))
function params(extra={}){return new URLSearchParams({memory:String(systemRam.value),vram:String(vram.value),disk:String(disk.value),...extra}).toString()}
function modelLink(id){return withBase('/'+props.platform+'/chat?'+params({model:id}))}
function videoLink(id){return withBase('/'+props.platform+'/video?'+params({model:id}))}
const guideLink=computed(()=>withBase('/'+props.platform+'/'+purpose.value+'?'+params()))

const capacity=computed(()=>filled.value&&purpose.value==='chat'
 ?shortlistOllama({platform:props.platform,memoryGb:systemRam.value,vramGb:vram.value,systemReserveGb:4,gpuReserveGb:Math.max(1,Math.min(3,vram.value*.12))}):null)
const chatModels=computed(()=>{
 if(!capacity.value || vram.value===0)return []
 const list=['q3','q7','llama','g4','q35','q38','oss','d14']
 return list.map(id=>capacity.value.rows.find(x=>x.model.id===id))
  .filter(r=>r&&r.tier!=='over'&&disk.value>=r.model.downloadGB+2)
  .slice(0,4)
})
const videos=computed(()=>filled.value&&purpose.value==='video'
 ?videoRecommendations({platform:props.platform,memoryGb:systemRam.value,vramGb:vram.value,diskGb:disk.value})
 :[])
const caveat=computed(()=>{
 if(purpose.value==='chat')return '语言模型按 GPU 显存做保守容量初筛。CPU Offload、CPU-only、MoE 速度与 KV 细节不在此计算；结果不是实测吞吐率。'
 if(purpose.value==='image')return '图像模型的显存占用会随模型格式、工作流节点、分辨率与批次变化；不能只凭显存数字断言 FLUX/SDXL 一定能运行。'
 if(purpose.value==='video')return '视频模型还受驱动、CUDA、组件和帧数影响，达到参考门槛仅代表值得尝试。本站不把未完整验证的 Wan 工作流当成成功案例。'
 return '音频识别可从较小的 whisper.cpp GGML 模型入门。此路线优先以 CPU 基本运行验证为准，不需要先安装 CUDA 视频推理环境。'
})
</script>

<template>
 <section class="nvidia-goal-advisor">
  <div class="portal-heading"><span>01</span><div><h2>确认自己的电脑配置</h2><p>这里面向 {{label}}。请自行填写系统内存、NVIDIA 专用显存和当前可用磁盘，不自动检测任何设备。</p></div></div>
  <div class="config-grid">
   <label>系统内存（RAM）
    <select v-model.number="systemRam"><option :value="0">请选择</option><option v-for="n in [4,8,12,16,24,32,48,64,96,128,256]" :key="n" :value="n">{{n}} GB</option></select>
   </label>
   <label>NVIDIA 专用显存（VRAM）
    <select v-model.number="vram"><option :value="-1">请选择</option><option :value="0">没有 NVIDIA GPU / 仅 CPU</option><option v-for="n in [2,4,6,8,10,12,16,20,24,32,40,48,64,80,96,128]" :key="n" :value="n">{{n}} GB</option></select>
   </label>
   <label>剩余磁盘空间
    <select v-model.number="disk"><option :value="0">请选择</option><option v-for="n in [10,20,30,50,80,100,120,160,256,512,1024]" :key="n" :value="n">{{n}} GB</option></select>
   </label>
  </div>
  <p class="fine">显卡型号、驱动版本与 CUDA 功能还需要进入相应教程进一步核对。同样是 24GB 显存，不同架构 GPU 的实际兼容性和速度也可能不同。</p>
  <div class="portal-heading"><span>02</span><div><h2>选择你想使用的模型类型</h2><p>每种模型都有独立安装与模型下载步骤，无需一次安装全部工具。</p></div></div>
  <div class="purpose-grid">
   <button v-for="item in categoryOptions" :key="item.id" class="purpose-card" :class="{selected:purpose===item.id}"
     type="button" :aria-pressed="purpose===item.id" @click="purpose=item.id">
    <span class="purpose-mark">{{item.mark}}</span><strong>{{item.title}}</strong><span>{{item.desc}}</span><small>{{item.backend}}</small>
   </button>
  </div>
  <div class="portal-heading"><span>03</span><div><h2>查看这一类的独立部署路线</h2><p>根据刚才填写的条件显示初步建议，然后进入适合自己系统的完整教程。</p></div></div>
  <div v-if="!filled||!purpose" class="empty">
   <strong>完成上面两步后显示专属路线</strong>
   <p>这里不会用网站作者的 Mac 配置，也不会在没选择硬件前给出确定推荐。</p>
  </div>
  <div v-else class="output" aria-live="polite">
   <p class="picked">{{label}} · {{systemRam}}GB RAM · {{vram}}GB VRAM · {{disk}}GB 磁盘 · {{choice?.title}}</p>
   <h3>{{choice?.title}}：你的下一步</h3>
   <p>{{caveat}}</p>
   <p v-if="vram===0 && (purpose==='image'||purpose==='video')" class="warning">当前选择的是无 NVIDIA CUDA。此专题的 CUDA 图像和视频路线不适用，暂时不要复制 NVIDIA 安装命令。可先尝试语言模型 CPU 模式或 CPU 语音识别。</p>
   <template v-if="purpose==='chat'">
    <h4>当前显存预算下的语言模型候选</h4>
    <div v-if="vram===0" class="fine">没有 NVIDIA GPU：这条 Ollama 的 CPU-only 方案仍可单独尝试，但速度和内存预算需自己验证；下面不显示 GPU 适配型号。</div>
    <div v-else-if="chatModels.length" class="candidate-list">
     <div v-for="r in chatModels" :key="r.model.id" class="candidate"><span><strong>{{r.model.name}}</strong><small>下载约 {{r.model.downloadGB}}GB · 估算预算 {{r.planningGiB}}GiB</small></span>
      <a :href="modelLink(r.model.id)">直接进入下载与运行步骤 →</a>
     </div>
    </div>
    <p v-else class="warning">已收录的量化模型中，没有满足当前显存及磁盘初筛条件的候选。CPU / 部分卸载方案可能存在，但本站尚未评估该路线。</p>
   </template>
   <template v-else-if="purpose==='video'">
    <h4>各视频模型的适用条件</h4>
    <div class="candidate-list">
     <div v-for="v in videos" :key="v.model.id" class="candidate">
      <span><strong>{{v.model.title}}</strong><small>{{v.status}}</small><small v-if="!v.eligible">{{v.reasons.join('；')}}</small></span>
      <a v-if="v.eligible" :href="videoLink(v.model.id)">直接进入这条视频路线 →</a><span v-else class="muted">暂不建议按此路线下载</span>
     </div>
    </div>
    <p class="fine">LTX Desktop 的官方推荐配置为 24GB+ 显存、32GB 系统内存和 100GB+ 可用磁盘；符合条件后还需检查实际 GPU 驱动和版本。</p>
   </template>
   <template v-else-if="purpose==='image'">
    <p>建议先在这台电脑安装 **ComfyUI**，运行基础工作流，再按工作流下载匹配的模型权重。无需为生成第一张图片先安装 LTX、Wan 或独立语言模型框架。</p>
   </template>
   <template v-else>
    <p>建议先用 **whisper.cpp** 和较小的多语言 GGML 权重，把一段本地录音转成文字。完成首次识别，再考虑更大模型和 GPU 加速。</p>
   </template>
   <a v-if="(purpose==='image'||purpose==='audio'||(purpose==='chat'&&!chatModels.length)) && !(vram===0 && purpose==='image')" class="next-link" :href="guideLink">继续按步骤安装{{choice?.title}} →</a>
  </div>
 </section>
</template>
<style scoped>
.nvidia-goal-advisor{margin:1.25rem 0 2.5rem}.portal-heading{display:flex;align-items:flex-start;gap:.85rem;margin:2.15rem 0 1rem}.portal-heading>span{flex:none;display:grid;place-items:center;width:2.2rem;height:2.2rem;border:1px solid var(--vp-c-brand-1);border-radius:10px;color:var(--vp-c-brand-1);background:var(--vp-c-brand-soft);font-weight:700}.portal-heading h2{border:0;padding:0;margin:0;font-size:1.27rem}.portal-heading p,.fine,.empty p,.output p{color:var(--vp-c-text-2);font-size:.87rem;line-height:1.7;margin:.25rem 0}
.config-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem}.config-grid label{display:grid;gap:.38rem;font-size:.88rem;font-weight:600}.config-grid select{width:100%;min-width:0;padding:.7rem;border-radius:9px;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg-soft);color:var(--vp-c-text-1)}
.purpose-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}.purpose-card{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:.26rem;padding:1rem;border:1px solid var(--vp-c-divider);border-radius:12px;background:var(--vp-c-bg-soft);cursor:pointer;color:var(--vp-c-text-1)}.purpose-card:hover,.purpose-card.selected,.purpose-card:focus-visible{border-color:var(--vp-c-brand-1)}.purpose-card.selected{background:var(--vp-c-brand-soft)}.purpose-mark{font-weight:700;color:var(--vp-c-brand-1);font-size:1.2rem}.purpose-card>span:not(.purpose-mark){font-size:.84rem;color:var(--vp-c-text-2)}.purpose-card small{color:var(--vp-c-text-3)}
.empty,.output{border-radius:12px;border:1px solid var(--vp-c-divider);padding:1.15rem;background:var(--vp-c-bg-soft)}.output h3{margin:.6rem 0}.output h4{margin:1rem 0 .5rem}.picked{color:var(--vp-c-brand-1)!important}
.candidate-list{display:grid;gap:.5rem}.candidate{display:flex;gap:.75rem;align-items:center;justify-content:space-between;padding:.85rem;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg);border-radius:9px}.candidate>span:first-child{display:flex;flex-direction:column;gap:.2rem}.candidate strong{font-size:.9rem}.candidate small,.muted{font-size:.78rem;color:var(--vp-c-text-2)}.candidate a{font-size:.86rem;font-weight:600;white-space:nowrap}.next-link{display:inline-flex;padding:.68rem 1rem;margin-top:1rem;border-radius:9px;color:white!important;background:var(--vp-c-brand-1);font-weight:600;font-size:.9rem;text-decoration:none}.warning{border-left:2px solid var(--vp-c-warning-1);padding-left:.7rem}
@media(max-width:650px){.config-grid,.purpose-grid{grid-template-columns:1fr}.candidate{flex-direction:column;align-items:flex-start}}
</style>