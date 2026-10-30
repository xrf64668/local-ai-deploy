<script setup lang="ts">
import {computed,onMounted,ref,watch} from 'vue'
import {withBase} from 'vitepress'
import {shortlistOllama} from '../../data/ollama-catalog.mjs'
import {videoRecommendations} from '../../data/model-video.mjs'
const props=defineProps<{platform:'ubuntu'|'windows'}>()
const step=ref(0),ram=ref(0),vram=ref(-1),disk=ref(0),task=ref('chat'),id=ref(''),done=ref(false)
const steps=['硬件','类型','模型','方案','安装下载','验证']
const categories=[{id:'chat',name:'聊天 / 编程'},{id:'image',name:'图片生成'},{id:'video',name:'视频生成'},{id:'audio',name:'语音识别'}]
const ready=computed(()=>ram.value>0&&vram.value>=0&&disk.value>0)
const chat=computed(()=>ready.value&&vram.value>0?shortlistOllama({platform:props.platform,memoryGb:ram.value,vramGb:vram.value,gpuReserveGb:Math.max(1,Math.min(3,vram.value*.12))}).rows.filter((r:any)=>r.tier!=='over'&&disk.value>=r.model.downloadGB+2):[])
const video=computed(()=>ready.value?videoRecommendations({platform:props.platform,memoryGb:ram.value,vramGb:vram.value,diskGb:disk.value}).filter((r:any)=>r.eligible):[])
const options=computed(()=>task.value==='chat'?chat.value.map((x:any)=>({id:x.model.id,name:x.model.name,tag:x.model.tag,source:x.model.source})):task.value==='video'?video.value.map((x:any)=>({id:x.model.id,name:x.model.title,source:x.model.modelUrl})):task.value==='image'&&vram.value>0?[{id:'comfyui',name:'ComfyUI 基础工作流',source:'https://www.comfy.org/download'}]:task.value==='audio'?[{id:'whisper',name:'whisper.cpp 多语言 base',source:'https://github.com/ggml-org/whisper.cpp'}]:[])
const selected=computed(()=>options.value.find((x:any)=>x.id===id.value))
const advance=computed(()=>step.value===0?ready.value:step.value===2?!!selected.value:step.value<5)
const key=computed(()=>`local-ai-deploy:v2:${props.platform}`)
const guide=computed(()=>withBase('/'+props.platform+'/'+task.value))
function taskChange(value:string){if(task.value!==value){task.value=value;id.value='';done.value=false}}
function choose(value:string){if(id.value!==value){id.value=value;done.value=false}}
function reset(){step.value=0;ram.value=0;vram.value=-1;disk.value=0;task.value='chat';id.value='';done.value=false}
watch([ram,vram,disk],()=>{done.value=false;if(!options.value.some((x:any)=>x.id===id.value)){id.value='';step.value=Math.min(step.value,2)}})
watch([step,ram,vram,disk,task,id,done],()=>{if(typeof localStorage!=='undefined')localStorage.setItem(key.value,JSON.stringify({step:step.value,ram:ram.value,vram:vram.value,disk:disk.value,task:task.value,id:id.value,done:done.value}))})
onMounted(()=>{try{const x=JSON.parse(localStorage.getItem(key.value)||'{}');if([4,8,12,16,24,32,48,64,96,128,256].includes(x.ram))ram.value=x.ram;if([0,2,4,6,8,10,12,16,20,24,32,40,48,64,80,96,128].includes(x.vram))vram.value=x.vram;if([10,20,30,50,80,100,120,160,256,512,1024].includes(x.disk))disk.value=x.disk;if(categories.some(y=>y.id===x.task))task.value=x.task;if(typeof x.id==='string')id.value=x.id;if(Number.isInteger(x.step))step.value=Math.min(5,Math.max(0,x.step));done.value=x.done===true;if(!ready.value)step.value=0;else if(step.value>=2&&!selected.value){id.value='';done.value=false;step.value=2}}catch{}const t=new URLSearchParams(location.search).get('task');if(categories.some(y=>y.id===t)){task.value=t!;id.value='';step.value=0}})
</script>
<template>
<section class="nv-wizard">
 <div class="head"><div><small>LOCAL AI DEPLOY · V2</small><h2>{{platform==='ubuntu'?'Ubuntu':'Windows'}} 部署向导</h2><p>在当前页面顺序完成六步；手动选择的配置会保存在本浏览器。</p></div><button type="button" @click="reset">重新开始</button></div>
 <nav class="progress" aria-label="部署进度"><button v-for="(s,i) in steps" :key="s" :disabled="i>step" :aria-current="i===step?'step':undefined" :class="{active:i===step}" @click="step=i">{{i+1}}. {{s}}</button></nav>
 <div class="body">
 <template v-if="step===0"><h3>填写硬件配置</h3><p>请在本机查询真实系统内存、独立显存和剩余空间。未进行自动检测。</p><div class="fields">
  <label>系统 RAM<select v-model.number="ram"><option :value="0">请选择</option><option v-for="n in [4,8,12,16,24,32,48,64,96,128,256]" :key="n" :value="n">{{n}} GB</option></select></label>
  <label>NVIDIA 显存<select v-model.number="vram"><option :value="-1">请选择</option><option :value="0">无 NVIDIA GPU</option><option v-for="n in [2,4,6,8,10,12,16,20,24,32,40,48,64,80,96,128]" :key="n" :value="n">{{n}} GB</option></select></label>
  <label>剩余磁盘<select v-model.number="disk"><option :value="0">请选择</option><option v-for="n in [10,20,30,50,80,100,120,160,256,512,1024]" :key="n" :value="n">{{n}} GB</option></select></label>
 </div><p>GPU 型号、驱动与 CUDA 版本仍需核对。满足容量条件不等于确认兼容。</p></template>
 <template v-else-if="step===1"><h3>选择模型类型</h3><div class="choices"><button v-for="x in categories" :key="x.id" type="button" :class="{chosen:task===x.id}" @click="taskChange(x.id)">{{x.name}}</button></div></template>
 <template v-else-if="step===2"><h3>根据硬件选择部署目标</h3><div v-if="options.length" class="choices"><button v-for="x in options" :key="x.id" :class="{chosen:id===x.id}" type="button" @click="choose(x.id)">{{x.name}}</button></div><p v-else>当前没有通过参考初筛的已收录模型，不会为未知配置生成未经验证的命令。可返回修改预算或选择语音识别。</p></template>
 <template v-else-if="step===3"><h3>部署方案</h3><p><strong>{{selected?.name}}</strong> · {{ram}} GB RAM · {{vram}} GB VRAM · {{disk}} GB 磁盘</p><p v-if="task==='chat'">采用 Ollama 官方客户端和经过筛选的模型标签，先运行成功再选择 API 接入。</p><p v-else-if="task==='audio'">采用 whisper.cpp。先完成基础 CPU 语音识别，暂不依赖 GPU。</p><p v-else-if="task==='image'">采用官方 ComfyUI 安装包和与当前软件版本匹配的图像工作流。</p><p v-else>视频模型需要额外核对驱动、CUDA、工作流、权重组件和许可证。符合容量条件仅意味着可以继续评估。</p><a v-if="selected?.source" :href="selected.source" target="_blank" rel="noopener noreferrer">查看上游模型 / 工具来源 ↗</a></template>
 <template v-else-if="step===4"><h3>安装和下载</h3>
  <template v-if="task==='chat'&&selected"><p>从 <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer">Ollama 官方下载</a> 安装适用于本系统的软件，启动后执行以下命令。</p><pre>ollama --version</pre><pre>ollama pull {{selected.tag}}</pre><pre>ollama list</pre></template>
  <template v-else-if="task==='image'"><p>下载并安装 <a href="https://www.comfy.org/download" target="_blank" rel="noopener noreferrer">ComfyUI 官方应用</a>。启动后选择基础文生图模板，按模板提供的仓库和文件清单下载匹配的模型、VAE 与文本编码器。先用默认分辨率生成一张图。</p></template>
  <template v-else-if="task==='audio'"><p>安装 Git、CMake、FFmpeg；在专用空项目目录打开终端，再按系统对应的完整脚本执行。为避免把 POSIX Shell 误用于 PowerShell，保留系统专项教程中的独立命令。</p><a :href="guide">查看本系统完整命令与依赖 →</a></template>
  <template v-else><p>当前 CUDA 视频路线具有多个独立组件；没有经当前驱动和框架版本验证的统一安装脚本，因此不能冒充一键部署。按该模型对应的官方系统安装说明检查、下载并启动。</p><a :href="guide">查看当前平台视频专项部署说明 →</a></template>
 </template>
 <template v-else><h3>真实输出验收</h3><template v-if="task==='chat'&&selected"><p>实际运行模型，收到回答才算通过：</p><pre>ollama run {{selected.tag}}</pre><p>输入 /bye 退出。HTTP API 可以在成功后再配置。</p></template><p v-else-if="task==='image'">必须得到能打开的图片文件，而不只是节点显示完成。</p><p v-else-if="task==='audio'">必须在真实录音上得到非空转写文本，并核对结果。</p><p v-else>必须获得实际可播放的视频文件，推荐用 ffprobe 检查输出格式和时长。</p><label><input type="checkbox" v-model="done"> 我已在本地真实执行并核对结果</label><p v-if="done">用户自行确认完成，网站未自动读取设备输出。</p></template>
 </div>
 <div class="actions"><button type="button" :disabled="step===0" @click="step--">上一步</button><span>{{step+1}} / 6</span><button v-if="step<5" type="button" :disabled="!advance" @click="step++">下一步 →</button><span v-else>已到最后一步</span></div>
</section>
</template>
<style scoped>
.nv-wizard{border:1px solid var(--vp-c-divider);border-radius:15px;overflow:hidden;margin:1.5rem 0}.head{padding:1.3rem;background:var(--vp-c-bg-soft);display:flex;justify-content:space-between;align-items:start;gap:1rem}.head h2{margin:0;border:0;padding:0}.head p,.body p{color:var(--vp-c-text-2);font-size:.9rem}.progress{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border-bottom:1px solid var(--vp-c-divider)}.progress button{padding:.7rem .15rem;font-size:.76rem}.progress button.active{color:var(--vp-c-brand-1);border-bottom:3px solid var(--vp-c-brand-1)}.progress button:disabled{opacity:.45}.body{padding:1.4rem;min-height:260px}.body h3{margin:0 0 1rem}.fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem}.fields label{display:grid;gap:.35rem}.fields select{width:100%;min-width:0;padding:.6rem;background:var(--vp-c-bg-soft);border:1px solid var(--vp-c-divider);border-radius:8px;color:var(--vp-c-text-1)}.choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem}.choices button{padding:1rem;text-align:left;border:1px solid var(--vp-c-divider);border-radius:9px;background:var(--vp-c-bg-soft)}.choices button.chosen{border-color:var(--vp-c-brand-1);background:var(--vp-c-brand-soft)}.body pre{padding:.7rem;overflow:auto;background:var(--vp-code-block-bg);border-radius:8px}.actions{display:flex;justify-content:space-between;align-items:center;padding:1rem;border-top:1px solid var(--vp-c-divider)}.actions button,.head button{padding:.5rem .8rem;border-radius:8px;border:1px solid var(--vp-c-divider)}.actions button:disabled{opacity:.4}@media(max-width:650px){.fields,.choices{grid-template-columns:1fr}.progress button{font-size:.65rem}.head{flex-direction:column}}
</style>