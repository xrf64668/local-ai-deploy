<script setup>
import {ref} from 'vue'
const term=ref('')
const results=ref([])
const error=ref('')
const loading=ref(false)
const fetched=ref(false)
async function search(){
 const q=term.value.trim()
 if(q.length<2){error.value='请输入至少两个字符，例如 LTX、Wan2.2、Qwen3.8';return}
 loading.value=true;error.value='';results.value=[];fetched.value=false
 const ac=new AbortController()
 const timer=setTimeout(()=>ac.abort(),12000)
 try{
  const url='https://huggingface.co/api/models?search='+encodeURIComponent(q)+'&sort=downloads&direction=-1&limit=20'
  const response=await fetch(url,{signal:ac.signal,headers:{Accept:'application/json'}})
  if(!response.ok)throw new Error('HTTP '+response.status)
  const data=await response.json()
  results.value=Array.isArray(data)?data.filter(x=>x.id&&/^[\w.-]+\/[\w.-]+$/.test(x.id)).slice(0,20):[]
  fetched.value=true
 }catch(e){error.value='无法从浏览器实时连接 Hugging Face（网络、跨域策略或服务限制）。可通过科学上网访问官方模型搜索，并在原仓库核对版本。'}
 finally{clearTimeout(timer);loading.value=false}
}
</script>
<template>
 <section class="hub-search">
  <p>本功能在访客点击查询时请求 <strong>Hugging Face Hub 官方公开 API</strong>，不通过本站的服务器，不需要访问令牌。搜索到的是公开仓库，<strong>并不代表已经审核、兼容你选择的设备，或一定能运行</strong>。</p>
  <form @submit.prevent="search" class="search-bar">
   <input v-model="term" type="search" aria-label="搜索官方模型" placeholder="输入模型名称，例如 Wan2.2、LTX、Qwen3.8" />
   <button type="submit" :disabled="loading">{{loading?'搜索中…':'搜索官方模型'}}</button>
  </form>
  <p v-if="error" class="error">{{error}} <a :href="'https://huggingface.co/models?search='+encodeURIComponent(term.trim())" target="_blank" rel="noopener noreferrer">打开官方搜索页 ↗</a></p>
  <p v-if="fetched" class="hint">官方 API 返回 {{results.length}} 个展示结果。请进入仓库查看模型卡、许可证、文件列表及适用的运行时。</p>
  <div class="result-list">
   <article v-for="m in results" :key="m.id" class="result">
    <strong>{{m.id}}</strong>
    <p>任务：{{m.pipeline_tag||'未标明'}} · 下载统计：{{Number(m.downloads||0).toLocaleString()}} · 喜欢：{{Number(m.likes||0).toLocaleString()}}</p>
    <a :href="'https://huggingface.co/'+m.id" target="_blank" rel="noopener noreferrer">打开原始仓库，核对文件与版本 ↗</a>
   </article>
  </div>
  <p v-if="fetched&&!results.length">没有找到匹配的公开模型，尝试更短的英文型号或在官方网页搜索。</p>
 </section>
</template>
<style scoped>
.search-bar{display:flex;gap:.7rem;flex-wrap:wrap;margin:1rem 0}.search-bar input{min-width:200px;flex:1;border:1px solid var(--vp-c-divider);border-radius:8px;background:var(--vp-c-bg);color:var(--vp-c-text-1);padding:.75rem}.search-bar button{padding:.7rem .95rem;border-radius:8px;background:var(--vp-c-brand-1);color:white}
.result-list{display:grid;gap:.7rem}.result{border:1px solid var(--vp-c-divider);border-radius:10px;padding:1rem;overflow-wrap:anywhere}.result p,.hint{color:var(--vp-c-text-2);font-size:.88rem}.error{color:var(--vp-c-danger-1)}
</style>