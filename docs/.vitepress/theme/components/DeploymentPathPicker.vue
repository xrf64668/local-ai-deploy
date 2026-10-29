<script setup>
import {ref,computed} from 'vue'
import {withBase} from 'vitepress'
const platform=ref('mac')
const target=ref('chat')
const systems={mac:'Mac / Apple Silicon',ubuntu:'Ubuntu / NVIDIA',windows:'Windows / NVIDIA'}
const goals={chat:'语言模型',image:'图像生成',video:'视频生成',audio:'语音识别'}
const route=computed(()=>withBase('/'+platform.value+'/?'+new URLSearchParams({task:target.value}).toString()))
</script>
<template>
 <section class="deployment-picker">
  <div class="selectors">
   <label>我使用的系统
    <select v-model="platform"><option value="mac">Mac · Apple Silicon</option><option value="ubuntu">Ubuntu · NVIDIA</option><option value="windows">Windows · NVIDIA</option></select>
   </label>
   <label>我想完成的任务
    <select v-model="target"><option value="chat">本地聊天 / 编程</option><option value="image">生成图片</option><option value="video">生成视频</option><option value="audio">语音识别</option></select>
   </label>
  </div>
  <p class="hint">已选 <strong>{{systems[platform]}} · {{goals[target]}}</strong>。下一页只需填写一次设备配置，就能直接进入该模型的完整操作教程。</p>
  <div class="outline">
   <span>即将完成：</span>
   <strong>① 填硬件 → ② 选具体模型 → ③ 下载并安装 → ④ 首次生成验收</strong>
   <small>这些是步骤预览，不需要逐项跳转。所有指令都在最终选择的模型教程中按顺序出现。</small>
  </div>
  <a class="go" :href="route">下一步：选择我的硬件配置 →</a>
 </section>
</template>
<style scoped>
.selectors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;padding:1rem;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg-soft);border-radius:12px}
.selectors label{display:grid;gap:.4rem;font-weight:600}.selectors select{padding:.7rem;width:100%;min-width:0;border-radius:8px;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg);color:var(--vp-c-text-1)}
.hint{color:var(--vp-c-text-2)}.outline{display:grid;gap:.4rem;margin:1rem 0;padding:1rem;border:1px solid var(--vp-c-divider);border-radius:10px}
.outline small{color:var(--vp-c-text-2)}.go{display:inline-flex;border-radius:8px;padding:.7rem 1rem;background:var(--vp-c-brand-1);color:#fff!important;text-decoration:none;font-weight:600}
@media(max-width:650px){.selectors{grid-template-columns:1fr}}
</style>