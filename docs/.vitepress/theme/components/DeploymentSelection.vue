<script setup>
import {onMounted,ref,computed} from 'vue'
const chip=ref(''),memory=ref(''),vram=ref(''),disk=ref('')
const model=ref('')
const names={
 'ltx23-mlx-q4':'LTX-2.3 MLX Q4',
 'ltx25-mlx-q4':'LTX-2.5 MLX Q4',
 'wan22-mlx-q8':'Wan2.2 MLX Q8',
 'ltx25-desktop-nvidia':'LTX-2.5 Desktop',
 'wan22-ti2v5b-cuda':'Wan2.2 CUDA'
}
onMounted(()=>{
 const q=new URLSearchParams(window.location.search)
 const c=q.get('chip')
 if(c && /^(?:M[1-9]\d?|other)$/.test(c))chip.value=c
 for(const [key,state] of [['memory',memory],['vram',vram],['disk',disk]]){
  const v=q.get(key)
  if(v!==null && /^(?:0|[1-9]\d{0,3})$/.test(v))state.value=v
 }
 if(Object.hasOwn(names,q.get('model')))model.value=q.get('model')
})
const show=computed(()=>!!(chip.value||memory.value||vram.value||disk.value||model.value))
</script>
<template>
 <aside v-if="show" class="deployment-selection">
  <strong>已保留你在上一页的选择</strong>
  <p>
   <span v-if="chip">芯片 {{chip}} · </span>
   <span v-if="memory">系统/统一内存 {{memory}} GB · </span>
   <span v-if="vram">显存 {{vram}} GB · </span>
   <span v-if="disk">可用磁盘 {{disk}} GB</span>
   <span v-if="model"> · 目标模型 {{names[model]}}</span>
  </p>
  <small>以上信息来自你在网站中填写的数值，不是自动检测，也不等于实机验证。以下按本教程从上往下操作，无需返回上一页重新选择。</small>
 </aside>
</template>
<style scoped>
.deployment-selection{padding:.9rem 1rem;border:1px solid var(--vp-c-divider);border-radius:10px;background:var(--vp-c-bg-soft);margin:1rem 0}
.deployment-selection p{margin:.4rem 0;font-size:.92rem}
.deployment-selection small{color:var(--vp-c-text-2);font-size:.8rem}
</style>