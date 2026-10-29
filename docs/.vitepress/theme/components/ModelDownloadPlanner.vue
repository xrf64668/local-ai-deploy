<script setup>
import {computed,onMounted,ref,watch} from 'vue'
import {withBase} from 'vitepress'
import {OLLAMA_MODELS,shortlistOllama} from '../../data/ollama-catalog.mjs'
import {VIDEO_PROFILES,videoRecommendations} from '../../data/model-video.mjs'

const props=defineProps({initialPlatform:{type:String,default:''}})
const platform=ref(props.initialPlatform)
const memory=ref(0)
const vram=ref(0)
const disk=ref(0)
const purpose=ref('all')
const modelId=ref('')
const network=ref('official')
const copied=ref(false)
const options=computed(()=>{
 if(!platform.value)return []
 return [
  ...OLLAMA_MODELS.filter(m=>purpose.value==='all'||purpose.value==='llm').map(m=>({id:m.id,title:m.name,kind:'llm',source:m.source,tag:m.tag,download:m.downloadGB+' GB',backend:'Ollama'})),
  ...VIDEO_PROFILES.filter(m=>m.platforms.includes(platform.value)&&(purpose.value==='all'||purpose.value==='video')).map(m=>({id:m.id,title:m.title,kind:'video',source:m.modelUrl,download:m.download,backend:m.backend}))
 ]
})
const selected=computed(()=>options.value.find(m=>m.id===modelId.value))
const video=computed(()=>selected.value?.kind==='video'?videoRecommendations({platform:platform.value,memoryGb:memory.value,vramGb:vram.value,diskGb:disk.value}).find(m=>m.model.id===modelId.value):null)
const ollama=computed(()=>selected.value?.kind==='llm'?shortlistOllama({platform:platform.value,memoryGb:memory.value,vramGb:vram.value}).rows.find(m=>m.model.id===modelId.value):null)
const ready=computed(()=>Boolean(platform.value&&selected.value&&memory.value>0&&(platform.value==='mac'||vram.value>0)&&(selected.value.kind!=='video'||disk.value>0)))
const canProceed=computed(()=>ready.value && (selected.value?.kind==='video'?video.value?.eligible:ollama.value?.tier!=='over'))
const status=computed(()=>{
 if(!ready.value)return '请选择系统、硬件与模型，才能得到基于当前访客配置的判断'
 if(video.value){return video.value.eligible?'达到上游参考起点，可进行真实部署验证':'尚未满足当前目录所列的硬件/磁盘参考要求'}
 return ollama.value?.tier==='over'?'容量规划预算不足，不建议直接下载大型权重':'初步容量可尝试；仍需确认模型版本与实际内存峰值'
})
const repoId=computed(()=>({ 'ltx25-mlx-q4':'dgrauet/ltx-2.5-mlx-q4','ltx23-mlx-q4':'dgrauet/ltx-2.3-mlx-q4','wan22-mlx-q8':'Anes1032/Wan2.2-TI2V-5B-mlx-q8','wan22-ti2v5b-cuda':'Wan-AI/Wan2.2-TI2V-5B' })[modelId.value]||'')
const modelFolder=computed(()=>({ 'ltx25-mlx-q4':'ltx25-q4','ltx23-mlx-q4':'ltx23-q4','wan22-mlx-q8':'wan22-q8','wan22-ti2v5b-cuda':'wan22-pytorch' })[modelId.value]||'selected-model')
const specificGuide=computed(()=>modelId.value==='ltx25-mlx-q4'?'/mac/models/ltx25':modelId.value==='wan22-mlx-q8'?'/mac/models/wan22':selected.value?.kind==='llm'?platform.value==='mac'?'/mac/models/ollama':'/'+platform.value+'/ollama':platform.value==='windows'?'/comfyui/windows':platform.value==='ubuntu'?'/comfyui/ubuntu':'/mac/03-runtime')
const setup=computed(()=>{
 if(selected.value?.kind!=='video'||!repoId.value)return ''
 if(platform.value==='windows')return [
 '# 在文件资源管理器中创建并打开你选好的专用模型文件夹，然后选择「在终端中打开」',
 '$PROJECT_ROOT = (Get-Location).Path',
 'py -3 -m venv .download-venv',
 '.\\.download-venv\\Scripts\\python.exe -m pip install -U huggingface_hub',
 '$env:HF_HOME = Join-Path $PROJECT_ROOT ".cache\\huggingface"'
 ].join('\n')
 if(platform.value==='mac')return [
 '# Mac：点击 Finder 选择已创建的专用模型文件夹；使用同一个终端执行后续命令',
 'PROJECT_ROOT=""',
 'if FOLDER="$(osascript -e \'POSIX path of (choose folder with prompt "选择模型项目目录")\')" && [ -d "$FOLDER" ]; then cd "$FOLDER" && PROJECT_ROOT="$(pwd -P)"; fi',
 '[ -n "$PROJECT_ROOT" ] || { echo "未选择目录，停止安装"; false; }',
 'python3 -m venv .download-venv',
 'source .download-venv/bin/activate',
 'export HF_HOME="$PROJECT_ROOT/.cache/huggingface"',
 'export PIP_CACHE_DIR="$PROJECT_ROOT/.cache/pip"',
 'python -m pip install -U huggingface_hub'
 ].join('\n')
 return [
 '# Linux：先在文件管理器创建专用文件夹，并在该文件夹中打开终端',
 'PROJECT_ROOT="$(pwd -P)"',
 'python3 -m venv .download-venv',
 'source .download-venv/bin/activate',
 'export HF_HOME="$PROJECT_ROOT/.cache/huggingface"',
 'export PIP_CACHE_DIR="$PROJECT_ROOT/.cache/pip"',
 'python -m pip install -U huggingface_hub'
 ].join('\n')
})
const downloadCommand=computed(()=>{
 if(!selected.value)return ''
 if(selected.value.kind==='llm')return 'ollama pull '+selected.value.tag+'\nollama list\nollama run '+selected.value.tag
 if(!repoId.value)return '# 当前路线使用官方桌面安装/工作流；请在部署文档中按该软件要求下载，不能用另一版本权重代替。'
 const repo=repoId.value
 const dir=modelFolder.value
 if(platform.value==='windows'){
  return '$env:HF_ENDPOINT = '+(network.value==='mirror'?"'https://hf-mirror.com'":"'https://huggingface.co'")+
   '\n.\\.download-venv\\Scripts\\hf.exe download '+repo+' --local-dir (Join-Path $PROJECT_ROOT "models\\'+dir+'")'
 }
 return (network.value==='mirror'?'HF_ENDPOINT=https://hf-mirror.com ':'')+'hf download '+repo+' --local-dir "$PROJECT_ROOT/models/'+dir+'"'
})
watch([platform,purpose],()=>{modelId.value='';copied.value=false},{flush:'sync'})
onMounted(()=>{
 const q=new URLSearchParams(window.location.search)
 const p=q.get('platform')
 if(['mac','ubuntu','windows'].includes(p))platform.value=p
 const m=Number(q.get('memory'))
 if([8,16,24,32,48,64,96,128,192].includes(m))memory.value=m
 const v=Number(q.get('vram'))
 if(v>0)vram.value=v
 const d=Number(q.get('disk'))
 if(d>0)disk.value=d
 const id=q.get('model')
 if(id && options.value.some(x=>x.id===id))modelId.value=id
})
async function copyCommand(){
 try{await navigator.clipboard.writeText(downloadCommand.value);copied.value=true}catch{copied.value=false}
}
</script>

<template>
 <section class="download-planner">
  <p class="notice">这些选择只用于本次页面计算，<strong>不自动检测你的电脑，也不会使用作者个人的测试配置作为默认结论</strong>。先填写你自己的系统和硬件，再查看下载路线。</p>
  <div class="planner-fields">
   <label>01 · 你的系统
    <select v-model="platform"><option value="">请选择系统</option><option value="mac">Mac · Apple Silicon</option><option value="ubuntu">Ubuntu · NVIDIA</option><option value="windows">Windows · NVIDIA</option></select>
   </label>
   <label>02 · 系统/统一内存
    <select v-model.number="memory"><option :value="0">请选择容量</option><option v-for="n in [8,16,24,32,48,64,96,128,192]" :key="n" :value="n">{{n}} GB</option></select>
   </label>
   <label v-if="platform && platform!=='mac'">NVIDIA 显存
    <select v-model.number="vram"><option :value="0">请选择显存</option><option v-for="n in [4,6,8,10,12,16,20,24,32,48,64,80]" :key="n" :value="n">{{n}} GB</option></select>
   </label>
   <label>03 · 任务类型
    <select v-model="purpose"><option value="all">全部</option><option value="llm">文字 / 编程 / 对话</option><option value="video">生成视频</option></select>
   </label>
   <label v-if="platform">04 · 具体模型
    <select v-model="modelId"><option value="">请选择模型</option><option v-for="m in options" :key="m.id" :value="m.id">{{m.title}} · {{m.backend}}</option></select>
   </label>
   <label v-if="selected?.kind==='video'">模型可用磁盘空间
    <select v-model.number="disk"><option :value="0">请选择剩余空间</option><option v-for="n in [20,30,40,60,80,100,120,160,256,512]" :key="n" :value="n">{{n}} GB</option></select>
   </label>
   <label>05 · 当前网络
    <select v-model="network"><option value="official">官方源（可直连或科学上网）</option><option value="mirror">国内访问受限，尝试 HF 社区镜像</option></select>
   </label>
  </div>
  <div v-if="selected" class="selected-summary">
   <h3>{{selected.title}}</h3>
   <p>运行后端：{{selected.backend}} · 模型下载量：{{selected.download}} · <a :href="selected.source" target="_blank" rel="noopener noreferrer">查看上游仓库与文件清单 ↗</a></p>
   <p><strong>当前配置判断：</strong>{{status}}</p>
   <p v-if="video && !video.eligible">{{video.reasons.join('；')}}</p>
   <p v-if="ollama">模型包约 {{ollama.weightGiB}} GiB；加上规划余量后约 {{ollama.planningGiB}} GiB，预算剩余约 {{ollama.remainingGiB}} GiB。此数值不是实测峰值。</p>
   <p v-if="ready && (video?.eligible||ollama?.tier!=='over')">你可以继续尝试部署。<strong>满足容量初筛不等于通过真实推理。</strong></p>
  </div>
  <p v-if="selected && ready && !canProceed" class="not-eligible">当前模型超出本站选用的硬件或磁盘参考条件，不作为这一配置的直接下载推荐。请调整实际容量、量化版本或选择更小模型；CPU 卸载、多卡等专用路线需要另外核实。</p>
  <div v-if="selected && canProceed" class="download-instructions">
   <h3>06 · 按当前选择执行下载</h3>
   <p v-if="selected.kind==='llm'">先根据 <a :href="withBase(specificGuide)">对应系统的 Ollama 安装步骤</a> 安装软件。Ollama 自行管理模型目录，下面的命令不用在 Python venv 中执行。</p>
   <p v-else-if="setup">先在自己选择的专用目录打开终端，准备本项目独立的下载器。首次运行以下准备命令需要网络和兼容的 Python。</p>
   <pre v-if="setup"><code>{{setup}}</code></pre>
   <p v-if="network==='mirror' && selected.kind==='video'">本路线使用 <a href="https://hf-mirror.com/" target="_blank" rel="noopener noreferrer">HF-Mirror 第三方社区镜像</a>，并非 Hugging Face 官方。需先核对许可与文件完整性；受限模型访问或令牌登录应优先使用官方仓库，不要把访问令牌发给镜像站点。</p>
   <p v-if="selected.kind==='llm' && network==='mirror'">Ollama 的模型注册表不等于 Hugging Face。这里仍使用 Ollama 官方拉取命令；网络不通时可根据网络条件使用科学上网，不能直接把 HF_ENDPOINT 用在 ollama pull 上。</p>
   <p v-if="selected.kind==='video' && !repoId">此运行后端没有可直接等价替换的 MLX 单仓库指令；请按照对应桌面软件/工作流的官方说明操作。</p>
   <pre><code>{{downloadCommand}}</code></pre>
   <button class="copy-command" type="button" @click="copyCommand">{{copied?'已复制命令':'复制当前下载命令'}}</button>
   <p class="fine">命令中的下载路径由<strong>访客自己选的目录</strong>动态生成；如需固定 revision，先在模型上游 History 页面复制真实 Commit SHA，再添加 --revision。下载完成请核对配置、模型文件、文本编码器与 VAE。</p>
   <p><a :href="withBase(specificGuide)">继续查看该系统的安装、推理和验收步骤 →</a></p>
  </div>
 </section>
</template>

<style scoped>
.download-planner{margin:1.3rem 0}.notice{padding:1rem;background:var(--vp-c-bg-soft);border:1px solid var(--vp-c-divider);border-radius:10px}
.planner-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.85rem}
.planner-fields label{display:grid;gap:.35rem;font-size:.88rem;font-weight:600}
.planner-fields select{width:100%;background:var(--vp-c-bg);color:var(--vp-c-text-1);border:1px solid var(--vp-c-divider);border-radius:8px;padding:.7rem}
.selected-summary,.download-instructions{margin:1.2rem 0;padding:1rem;border:1px solid var(--vp-c-divider);border-radius:12px}
.selected-summary h3{margin:0}.selected-summary p{margin:.55rem 0}
.download-instructions pre{overflow-x:auto;background:var(--vp-code-block-bg);padding:1rem;border-radius:9px;font-size:.84rem;white-space:pre-wrap;overflow-wrap:anywhere}
.copy-command{border:1px solid var(--vp-c-brand-1);color:var(--vp-c-brand-1);padding:.55rem .9rem;border-radius:8px;cursor:pointer}
.fine{font-size:.86rem;color:var(--vp-c-text-2)}.not-eligible{border-left:3px solid var(--vp-c-danger-1);padding:.85rem 1rem;background:var(--vp-c-bg-soft)}
</style>
