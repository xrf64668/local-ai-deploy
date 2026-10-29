<script setup>
import {computed,ref} from 'vue'
import {withBase} from 'vitepress'
const term=ref('')
const results=ref([])
const error=ref('')
const loading=ref(false)
const fetched=ref(false)
const chosen=ref(null)
const system=ref('mac')
const checked=ref(false)
const copied=ref(false)
async function search(){
 const q=term.value.trim()
 if(q.length<2){error.value='请输入至少两个字符，例如 LTX、Wan2.2、Qwen3.8';return}
 loading.value=true;error.value='';results.value=[];fetched.value=false;chosen.value=null;checked.value=false
 const ac=new AbortController()
 const timer=setTimeout(()=>ac.abort(),12000)
 try{
  const url='https://huggingface.co/api/models?search='+encodeURIComponent(q)+'&sort=downloads&direction=-1&limit=20'
  const response=await fetch(url,{signal:ac.signal,headers:{Accept:'application/json'}})
  if(!response.ok)throw new Error('HTTP '+response.status)
  const data=await response.json()
  results.value=Array.isArray(data)?data.filter(x=>x.id&&/^[\w.-]+\/[\w.-]+$/.test(x.id)).slice(0,20):[]
  fetched.value=true
 }catch(e){error.value='无法从浏览器实时连接 Hugging Face。请检查网络，或前往官方搜索页；有需要时可使用科学上网。'}
 finally{clearTimeout(timer);loading.value=false}
}
function choose(model){chosen.value=model;checked.value=false;copied.value=false}
const folder=computed(()=>chosen.value?.id.split('/')[1]||'model')
const command=computed(()=>{
 if(!chosen.value||!checked.value)return ''
 const id=chosen.value.id
 if(system.value==='windows')return [
  '# 在自己创建的空模型文件夹中打开 PowerShell，再逐行运行',
  '$PROJECT_ROOT = (Get-Location).Path',
  '$env:PIP_CACHE_DIR = Join-Path $PROJECT_ROOT ".cache\\pip"',
  '$env:HF_HOME = Join-Path $PROJECT_ROOT ".cache\\huggingface"',
  'py -3 -m venv .download-venv',
  '.\\.download-venv\\Scripts\\python.exe -m pip install -U huggingface_hub',
  '.\\.download-venv\\Scripts\\hf.exe download '+id+' --local-dir (Join-Path $PROJECT_ROOT "models\\'+folder.value+'")'
 ].join('\n')
 return [
  '# 在自己创建的空模型文件夹里打开终端，再逐行运行',
  'PROJECT_ROOT="$(pwd -P)"',
  'export PIP_CACHE_DIR="$PROJECT_ROOT/.cache/pip"',
  'export HF_HOME="$PROJECT_ROOT/.cache/huggingface"',
  'python3 -m venv .download-venv',
  './.download-venv/bin/python -m pip install -U huggingface_hub',
  './.download-venv/bin/hf download '+id+' --local-dir "$PROJECT_ROOT/models/'+folder.value+'"'
 ].join('\n')
})
async function copy(){
 try{await navigator.clipboard.writeText(command.value);copied.value=true}
 catch{copied.value=false}
}
</script>

<template>
 <section class="hub-search">
  <label for="hub-query"><strong>输入你想找的模型名称</strong></label>
  <form @submit.prevent="search" class="search-bar">
   <input id="hub-query" v-model="term" type="search" placeholder="例如 Qwen3.8、LTX-2.5、Wan2.2" />
   <button type="submit" :disabled="loading">{{loading?'正在查找…':'搜索官方模型'}}</button>
  </form>
  <p class="hint">搜索将实时查询 Hugging Face 的公开目录，结果不代表已经适配你的电脑。</p>
  <p v-if="error" class="error">{{error}} <a :href="'https://huggingface.co/models?search='+encodeURIComponent(term.trim())" target="_blank" rel="noopener noreferrer">打开 Hugging Face 官方搜索 ↗</a></p>
  <p v-if="fetched" class="hint">找到 {{results.length}} 个公开仓库。先点开模型卡和文件列表，确认作者、格式、文件体积和许可证。</p>
  <div class="result-list">
   <article v-for="m in results" :key="m.id" class="result">
    <strong>{{m.id}}</strong>
    <p>{{m.pipeline_tag||'任务类型未注明'}} · {{Number(m.downloads||0).toLocaleString()}} 次下载</p>
    <div class="result-actions">
     <a :href="'https://huggingface.co/'+m.id" target="_blank" rel="noopener noreferrer">第一步：看模型官方仓库 ↗</a>
     <button type="button" @click="choose(m)">第二步：查看下载方法</button>
    </div>
   </article>
  </div>
  <p v-if="fetched&&!results.length">没有匹配结果，可尝试英文型号或简短关键词。</p>
  <div v-if="chosen" class="follow-on">
   <h3>准备下载：{{chosen.id}}</h3>
   <p>先打开 <a :href="'https://huggingface.co/'+chosen.id+'/tree/main'" target="_blank" rel="noopener noreferrer">这个仓库的文件列表 ↗</a>。确认确实是目标权重，而不是碰巧同名的其他格式。</p>
   <p class="hint">特别提醒：原版 PyTorch safetensors、Mac MLX 和 GGUF 不是可以随便互换的文件。这个公开搜索结果<strong>未经本站兼容性审核</strong>，也没有提供可靠的硬件估算。</p>
   <label class="confirm"><input type="checkbox" v-model="checked" /> 我已看过原仓库，确认模型格式、许可证和运行时适合我的用途</label>
   <div v-if="checked" class="download-help">
    <label>准备在哪个系统下载？
     <select v-model="system">
      <option value="mac">Mac / Apple Silicon</option>
      <option value="ubuntu">Ubuntu / Linux</option>
      <option value="windows">Windows / PowerShell</option>
     </select>
    </label>
    <p>先自己创建一个专用文件夹，在这个文件夹内打开终端，然后<strong>按顺序执行以下命令</strong>。环境、缓存、模型都存放在该文件夹内。</p>
    <pre><code>{{command}}</code></pre>
    <button type="button" class="copy-btn" @click="copy">{{copied?'已复制':'复制下载命令'}}</button>
    <p>下载完成的标志： 终端没有报错，并且模型文件夹里能找到与仓库 Files 列表一致的文件。下一步还要选择正确的推理工具，并完成首次生成验证。</p>
    <p class="hint">国内官方仓库访问受限时可使用科学上网，或阅读 <a  :href="withBase('/guide/model-download')">国内外下载说明</a>。不要将受限仓库的访问令牌交给第三方镜像。</p>
   </div>
   <p v-else class="hint">核对前不自动生成下载命令，防止下载与系统不匹配的几十 GB 权重。想要有硬件容量参考的候选，先去 <a  :href="withBase('/guide/deploy')">按设备选模型</a>。</p>
  </div>
 </section>
</template>
<style scoped>
.search-bar{display:flex;gap:.7rem;flex-wrap:wrap;margin:.7rem 0}.search-bar input{min-width:200px;flex:1;border:1px solid var(--vp-c-divider);border-radius:8px;background:var(--vp-c-bg);color:var(--vp-c-text-1);padding:.75rem}
.search-bar button,.result-actions button,.copy-btn{padding:.6rem .85rem;border-radius:8px;border:1px solid var(--vp-c-brand-1);color:var(--vp-c-brand-1);cursor:pointer}
.search-bar button{background:var(--vp-c-brand-1);color:white}.search-bar button:disabled{opacity:.65}
.result-list{display:grid;gap:.55rem}.result{border:1px solid var(--vp-c-divider);border-radius:10px;padding:.85rem;overflow-wrap:anywhere}
.result p,.hint{color:var(--vp-c-text-2);font-size:.88rem;margin:.45rem 0}.result-actions{display:flex;flex-wrap:wrap;gap:.8rem;align-items:center;font-size:.87rem}
.follow-on{margin:1.25rem 0;padding:1.2rem;background:var(--vp-c-bg-soft);border:1px solid var(--vp-c-divider);border-radius:12px}
.follow-on h3{margin:.15rem 0 .7rem}.follow-on p{margin:.7rem 0}
.confirm{display:flex;align-items:flex-start;gap:.5rem;font-size:.9rem;font-weight:600;margin:1rem 0}
.download-help label{display:grid;gap:.3rem;font-weight:600;font-size:.9rem}.download-help select{padding:.6rem;border:1px solid var(--vp-c-divider);border-radius:8px;background:var(--vp-c-bg);color:var(--vp-c-text-1);max-width:360px}
.download-help pre{padding:1rem;border-radius:9px;background:var(--vp-code-block-bg);font-size:.81rem;white-space:pre-wrap;overflow-wrap:anywhere;overflow-x:auto}.error{color:var(--vp-c-danger-1)}
</style>