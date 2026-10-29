<script setup>
import {computed, onMounted, ref} from 'vue'
import {OLLAMA_MODELS} from '../../data/ollama-catalog.mjs'

const props=defineProps({platform:{type:String,required:true}})
const selected=ref('q3')
const memory=ref('')
const vram=ref('')
const disk=ref('')
const current=computed(()=>OLLAMA_MODELS.find(x=>x.id===selected.value)||OLLAMA_MODELS.find(x=>x.id==='q3'))
onMounted(()=>{
 const q=new URLSearchParams(window.location.search)
 const model=q.get('model')
 if(OLLAMA_MODELS.some(x=>x.id===model))selected.value=model
 for(const [key,state] of [['memory',memory],['vram',vram],['disk',disk]]){
  const raw=q.get(key)
  if(raw!==null && /^(?:0|[1-9]\d{0,3})$/.test(raw)) state.value=raw
 }
})
const isWindows=computed(()=>props.platform==='windows')
</script>
<template>
 <section class="one-page-ollama" aria-label="所选语言模型的完整下载和运行操作">
  <p v-if="memory || vram || disk" class="hardware-recap">
   你的上一步选择：
   <span v-if="memory">系统内存 {{memory}}GB </span>
   <span v-if="vram">显存 {{vram}}GB </span>
   <span v-if="disk">可用磁盘 {{disk}}GB</span>
   <small>这是用户输入的参考信息，本站没有直接检测设备。</small>
  </p>
  <label for="quick-ollama-model"><strong>确定要安装的语言模型</strong></label>
  <select id="quick-ollama-model" v-model="selected">
   <option v-for="m in OLLAMA_MODELS" :key="m.id" :value="m.id">{{m.name}}（约 {{m.downloadGB}} GB）</option>
  </select>
  <p>模型标签：<code>{{current.tag}}</code> · <a :href="current.source" target="_blank" rel="noopener noreferrer">查看模型原始发布页面 ↗</a></p>
  <p class="note">如果刚从硬件推荐页进入，上面已自动带入你选的型号。修改型号不会自动证明它适合当前显存，下载前仍应检查容量。</p>
  <div class="operation"><h3>操作 A · 下载模型</h3>
   <p>确认 Ollama 已安装并启动后，在{{isWindows?'PowerShell':'终端'}}输入：</p>
   <pre><code>ollama pull {{current.tag}}</code></pre>
   <p class="note">文件体积取决于当前发布标签。下载失败先检查网络、官方标签和可用空间。</p>
  </div>
  <div class="operation"><h3>操作 B · 检查是否下载完整</h3>
   <pre><code>ollama list</code></pre>
   <p class="note">列表中能看到 <code>{{current.tag}}</code>，只证明模型已经下载。</p>
  </div>
  <div class="operation"><h3>操作 C · 第一次真实运行</h3>
   <pre><code>ollama run {{current.tag}}</code></pre>
   <p>在终端提问「请解释本地 AI 的用途」，**真正得到模型回复**后才算完成部署。输入 <code>/bye</code> 退出。</p>
  </div>
 </section>
</template>
<style scoped>
.one-page-ollama{padding:1rem;margin:1rem 0 1.5rem;border:1px solid var(--vp-c-divider);border-radius:12px;background:var(--vp-c-bg-soft)}
.one-page-ollama select{display:block;width:100%;max-width:440px;padding:.7rem;margin:.6rem 0;border:1px solid var(--vp-c-divider);border-radius:8px;background:var(--vp-c-bg);color:var(--vp-c-text-1)}
.one-page-ollama p{margin:.5rem 0}.operation{padding-top:.65rem;border-top:1px solid var(--vp-c-divider);margin-top:.9rem}
.operation h3{font-size:1rem;margin:.4rem 0}.operation pre{padding:.7rem;border-radius:8px;background:var(--vp-code-block-bg);overflow:auto}
.note,.hardware-recap small{font-size:.84rem;color:var(--vp-c-text-2)}.hardware-recap{padding:.7rem;border-radius:8px;background:var(--vp-c-bg)}
.hardware-recap small{display:block}
</style>