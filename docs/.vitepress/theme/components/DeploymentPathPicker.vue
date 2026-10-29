<script setup>
import {ref,computed} from 'vue'
import {withBase} from 'vitepress'
const platform=ref('mac')
const target=ref('llm')
const advanced=ref(false)
const names={mac:'Mac',ubuntu:'Ubuntu',windows:'Windows'}
const install=computed(()=>{
 if(target.value==='llm')return platform.value==='mac'?'/mac/models/ollama':'/'+platform.value+'/ollama'
 if(target.value==='image')return platform.value==='mac'?(advanced.value?'/comfyui/mac-manual':'/comfyui/mac'):'/comfyui/'+platform.value
 if(target.value==='video')return platform.value==='mac'&&advanced.value?'/mac/models/ltx25':'/comfyui/'+platform.value
 return '/guide/choose-tool'
})
const verify=computed(()=>target.value==='llm'?install.value:target.value==='audio'?'/guide/choose-tool':'/comfyui/first-workflow')
const api=computed(()=>target.value==='llm'?platform.value==='mac'?'/mac/07-api':install.value:target.value==='audio'?'/guide/choose-tool':'/comfyui/api')
const stages=computed(()=>[
 {id:'01',name:'确认电脑配置',summary:'查看 GPU、内存或显存、操作系统和磁盘空间',link:platform.value==='mac'?'/mac/01-preflight':'/guide/hardware'},
 {id:'02',name:'计算容量与选择模型',summary:target.value==='llm'?'输入量化、上下文和内存，查看有公式的容量评估':'根据任务选择模型与权重；图像和视频还需工作流验证',link:target.value==='llm'?'/recommend/':'/comfyui/models-and-paths'},
 {id:'03',name:'安装运行工具',summary:'使用适合本机的安装教程，检查安装日志和服务状态',link:install.value},
 {id:'04',name:'完成第一次真实推理',summary:target.value==='llm'?'让模型回答问题，而不只是下载成功':'生成并打开实际文件，确认不是只启动了程序',link:verify.value},
 {id:'05',name:'按需要接入 API',summary:'先验证生成，再学习 HTTP 调用、任务状态和安全访问',link:api.value}
])
</script>
<template>
 <section class="deployment-picker">
  <div class="selectors">
   <label>我的电脑
    <select v-model="platform"><option value="mac">Mac · Apple Silicon</option><option value="ubuntu">Ubuntu · NVIDIA</option><option value="windows">Windows · NVIDIA</option></select>
   </label>
   <label>想运行什么
    <select v-model="target"><option value="llm">语言模型与本地聊天</option><option value="image">生成图片</option><option value="video">生成视频</option><option value="audio">语音识别</option></select>
   </label>
   <label>我的经验
    <select v-model="advanced"><option :value="false">第一次部署</option><option :value="true">熟悉命令行</option></select>
   </label>
  </div>
  <p class="hint">已选择 {{ names[platform] }}。依次完成五步；某个模型能下载，不代表它一定能在当前硬件上推理。{{target==='audio'?'语音专项的完整安装教程仍在整理中，现提供工具选型入口。':''}}</p>
  <div class="stages">
   <article v-for="stage in stages" :key="stage.id" class="stage">
    <strong class="number">{{stage.id}}</strong>
    <div><h3>{{stage.name}}</h3><p>{{stage.summary}}</p><a :href="withBase(stage.link)">查看这一步 →</a></div>
   </article>
  </div>
 </section>
</template>
<style scoped>
.selectors{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;background:var(--vp-c-bg-soft);border:1px solid var(--vp-c-divider);padding:1rem;border-radius:12px}.selectors label{display:grid;gap:.45rem;font-size:.9rem;font-weight:600}.selectors select{background:var(--vp-c-bg);color:var(--vp-c-text-1);border:1px solid var(--vp-c-divider);border-radius:8px;padding:.7rem;width:100%}.hint{color:var(--vp-c-text-2)}.stages{display:grid;gap:.8rem}.stage{display:flex;gap:1rem;border:1px solid var(--vp-c-divider);border-radius:12px;padding:1rem}.number{font-size:1.4rem;color:var(--vp-c-brand-1)}.stage h3{margin:0}.stage p{margin:.4rem 0;color:var(--vp-c-text-2)}
</style>
