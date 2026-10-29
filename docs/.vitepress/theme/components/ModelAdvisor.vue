<script setup>
import {computed,ref} from 'vue'
import {withBase} from 'vitepress'
import {MODEL_PROFILES,QUANTIZATION,estimateLLM,assessBudget,round2} from '../../data/model-memory.mjs'

const props=defineProps({
  initialPlatform:{type:String,default:'mac'},
  lockPlatform:{type:Boolean,default:false}
});
const platform=ref(props.initialPlatform)
const chip=ref('M4')
const task=ref('llm')
const memory=ref(32)
const vram=ref(12)
const reserve=ref(4)
const gpuReserve=ref(1.5)
const quant=ref('q4')
const context=ref(4096)
const concurrent=ref(1)
const selectedId=ref('qwen25-7b')
const actualFile=ref(0)
const custom=ref({paramsB:8,layers:32,hidden:4096,heads:32,kvHeads:8})
const profiles=computed(()=>[...MODEL_PROFILES,{id:'custom',name:'自定义 Transformer 模型',...custom.value,maxContext:131072,source:'https://huggingface.co/docs/transformers/main_classes/configuration'}])
const active=computed(()=>profiles.value.find(m=>m.id===selectedId.value)||profiles.value[0])
const results=computed(()=>profiles.value.map(model=>{
  try{
    const estimate=estimateLLM({
      model,quant:quant.value,context:context.value,concurrent:concurrent.value,
      actualWeightGiB:model.id===selectedId.value?Number(actualFile.value):0
    })
    const budget=assessBudget({
      estimate,platform:platform.value,memoryGb:Number(memory.value),vramGb:Number(vram.value),
      systemReserveGb:Number(reserve.value),gpuReserveGb:Number(gpuReserve.value)
    })
    return {model,estimate,budget}
  }catch(error){
    return {model,error:error instanceof Error?error.message:'输入参数无效'}
  }
}))
const selected=computed(()=>results.value.find(r=>r.model.id===selectedId.value))
const taskRoutes=computed(()=>{
  const p=platform.value
  if(task.value==='image')return {title:'ComfyUI：首次安装并生成图片',primary:p==='mac'?'/comfyui/mac':p==='ubuntu'?'/comfyui/ubuntu':'/comfyui/windows',secondary:'/comfyui/first-workflow',note:'图像峰值显存依赖工作流、分辨率、VAE、模型和节点，当前不使用语言模型的 KV 缓存公式计算。'}
  if(task.value==='video')return {title:'ComfyUI 视频工作流与模型匹配',primary:p==='mac'?'/mac/models/ltx25':p==='ubuntu'?'/comfyui/ubuntu':'/comfyui/windows',secondary:'/comfyui/models-and-paths',note:'视频峰值还取决于帧数、分辨率、注意力实现与卸载方式。本站暂不输出伪精确的“需要 X GB”结论。'}
  return {title:'Whisper：本地语音识别',primary:'/guide/choose-tool',secondary:'/guide/hardware',note:'语音模型的可运行资源与实现相关，需按选定模型和设备进行实测，不能套用 LLM 的 KV 缓存公式。'}
})
const label=t=>t==='candidate'?'具有进一步验证的容量空间':t==='tight'?'接近可用上限，建议谨慎尝试':'超出当前全 GPU 预算'
const deployment=computed(()=>platform.value==='mac'?'/mac/models/ollama':platform.value==='ubuntu'?'/ubuntu/ollama':'/windows/ollama')
</script>

<template>
  <section class="calculator" aria-label="本地模型硬件容量计算器">
    <p class="notice"><strong>这是实时计算，不是按固定内存门槛查表。</strong> 你修改参数后，系统会重新计算权重、KV 缓存、推理预留及可用预算。结果是<strong>容量估算</strong>，不是自动读取硬件或已通过实际推理的证明。</p>
    <div class="controls">
      <label v-if="!props.lockPlatform">运行平台
        <select v-model="platform">
          <option value="mac">Mac · Apple Silicon</option>
          <option value="ubuntu">Ubuntu · NVIDIA</option>
          <option value="windows">Windows · NVIDIA</option>
        </select>
      </label>
      <label v-if="platform==='mac'">芯片系列
        <select v-model="chip">
          <option v-for="n in ['M1','M2','M3','M4','M5']" :key="n" :value="n">{{ n }} 系列</option>
        </select>
      </label>
      <label>模型任务
        <select v-model="task">
          <option value="llm">大语言模型（容量计算）</option>
          <option value="image">图片生成（部署路线）</option>
          <option value="video">视频生成（部署路线）</option>
          <option value="audio">语音识别（部署路线）</option>
        </select>
      </label>
      <label>{{ platform==='mac'?'统一内存':'系统内存' }}
        <select v-model.number="memory">
          <option v-for="n in [8,16,24,32,48,64,96,128,192]" :key="n" :value="n">{{ n }} GB</option>
        </select>
      </label>
      <label v-if="platform!=='mac'">NVIDIA 显存
        <select v-model.number="vram">
          <option v-for="n in [0,4,6,8,10,12,16,20,24,32,48,64,80]" :key="n" :value="n">{{ n }} GB</option>
        </select>
      </label>
    </div>

    <template v-if="task==='llm'">
      <div class="controls secondary">
        <label>权重量化格式
          <select v-model="quant">
            <option v-for="(q,key) in QUANTIZATION" :key="key" :value="key">{{ q.name }}</option>
          </select>
        </label>
        <label>上下文长度
          <select v-model.number="context">
            <option v-for="n in [2048,4096,8192,16384,32768]" :key="n" :value="n">{{ n.toLocaleString() }} tokens</option>
          </select>
        </label>
        <label>同时运行的会话
          <select v-model.number="concurrent">
            <option v-for="n in [1,2,4,8]" :key="n" :value="n">{{ n }} 个</option>
          </select>
        </label>
        <label v-if="platform==='mac'">为系统及其他软件预留
          <select v-model.number="reserve">
            <option v-for="n in [2,4,6,8,12,16]" :key="n" :value="n">{{ n }} GiB</option>
          </select>
        </label>
        <label v-else>为显卡桌面/驱动预留
          <select v-model.number="gpuReserve">
            <option v-for="n in [0.5,1,1.5,2,4,6]" :key="n" :value="n">{{ n }} GiB</option>
          </select>
        </label>
      </div>
      <p class="fine">{{ platform==='mac'?chip+' · 系统预留可修改，使用统一内存作为预算。':'以单张显卡、权重和 KV 全部放在显存的情形计算；不把系统内存当作可直接替代的显存。' }} 计算不预测速度，也不模拟 CPU 卸载。</p>

      <h3>第一步 · 选择想运行的模型</h3>
      <label class="model-label">模型与参数结构
        <select v-model="selectedId" @change="actualFile=0">
          <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </label>
      <details v-if="selectedId==='custom'" open>
        <summary>填写自定义模型的架构信息</summary>
        <div class="controls">
          <label>参数量（十亿 B）<input v-model.number="custom.paramsB" type="number" min=".01" max="200" step=".01"></label>
          <label>层数（layers）<input v-model.number="custom.layers" type="number" min="1" max="256" step="1"></label>
          <label>隐藏维度（hidden size）<input v-model.number="custom.hidden" type="number" min="64" max="32768" step="64"></label>
          <label>注意力头数（heads）<input v-model.number="custom.heads" type="number" min="1" max="256" step="1"></label>
          <label>KV 头数（KV heads）<input v-model.number="custom.kvHeads" type="number" min="1" max="256" step="1"></label>
        </div>
        <p class="fine">这些参数通常可从模型发布仓库的 config.json 中查到。不规则注意力、MoE、滑动窗口、多模态等需要专门估算。</p>
      </details>
      <label class="model-label">实际 GGUF 权重文件大小（GiB，可选）
        <input v-model.number="actualFile" type="number" min="0" max="2048" step=".01" placeholder="0 = 按参数量和量化精度估算">
      </label>
      <p class="fine">如果已下载权重，填写文件大小会替换权重部分的近似值；输入 0 则使用量化平均 bit/参数估算。注意 1 GiB = 1024³ bytes。</p>

      <template v-if="selected && !selected.error">
        <h3>第二步 · 查看这台机器的计算结果</h3>
        <div class="metrics">
          <div><span>模型权重</span><strong>{{ round2(selected.estimate.weightsGiB) }} GiB</strong></div>
          <div><span>KV 缓存（FP16）</span><strong>{{ round2(selected.estimate.kvGiB) }} GiB</strong></div>
          <div><span>推理工作区（预留）</span><strong>{{ round2(selected.estimate.workspaceGiB) }} GiB</strong></div>
          <div class="emphasis"><span>估算总量</span><strong>{{ round2(selected.estimate.totalGiB) }} GiB</strong></div>
          <div><span>{{ selected.budget.target }}预算</span><strong>{{ round2(selected.budget.budgetGiB) }} GiB</strong></div>
          <div><span>估算预算结余</span><strong>{{ round2(selected.budget.remainingGiB) }} GiB</strong></div>
        </div>
        <p class="verdict" :class="selected.budget.tier">{{ label(selected.budget.tier) }}</p>
        <p class="fine">权重 ≈ 参数量 × 每参数字节数；KV ≈ 2 × 层数 × KV头数 × 每头维度 × 上下文 × 每元素2字节 × 并发数；工作区预留 ≈ max(0.8 GiB, 权重的15%)。实际不同加载器、批次、GPU buffer 和非量化张量可能出现更高峰值。</p>
        <p v-if="selectedId!=='custom'" class="fine">模型参数结构：<a :href="active.source" target="_blank" rel="noopener noreferrer">官方模型卡及配置</a>。Q4/Q8 的平均 bit 值是近似，精度应以实际 GGUF 文件大小为准。</p>
      </template>
      <p v-else class="error">请检查模型参数：{{ selected?.error || '计算参数无效' }}</p>

      <h3>第三步 · 对比其他模型的容量</h3>
      <div class="comparison">
        <div v-for="r in results.filter(x=>x.model.id!=='custom')" :key="r.model.id" class="item">
          <div class="item-head"><strong>{{ r.model.name }}</strong><span>{{ r.error ? '参数待检查' : label(r.budget.tier) }}</span></div>
          <p v-if="!r.error" class="fine">权重 {{ round2(r.estimate.weightsGiB) }} + KV {{ round2(r.estimate.kvGiB) }} + 工作区 {{ round2(r.estimate.workspaceGiB) }} = <strong>{{ round2(r.estimate.totalGiB) }} GiB</strong></p>
        </div>
      </div>
      <p class="fine">其他模型的权重使用量化估算，不会套用你为当前模型填写的实际文件大小。显存预算不足意味着**不能按当前假设全部放入 GPU**，并不等于 CPU/显存混合运行绝对不可能。</p>
      <p class="next"><a :href="withBase(deployment)">按照本机平台进入 Ollama 安装教程 →</a></p>
    </template>
    <template v-else>
      <h3>推荐的实际部署路线</h3>
      <p><strong>{{ taskRoutes.title }}</strong></p>
      <p>{{ taskRoutes.note }}</p>
      <p class="next"><a :href="withBase(taskRoutes.primary)">进入安装步骤 →</a> · <a :href="withBase(taskRoutes.secondary)">查看相关说明</a></p>
      <p class="fine">若需进行真实图像/视频显存测算，需提供模型精度、工作流图、分辨率、帧数、批量、GPU 后端和实测峰值；没有这些输入时不产生假“适配”结果。</p>
    </template>
  </section>
</template>

<style scoped>
.calculator{margin:1.2rem 0 2rem;line-height:1.7}.notice{padding:1rem 1.15rem;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg-soft);border-radius:12px}.controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:.85rem;margin:1.25rem 0}.controls label,.model-label{display:flex;flex-direction:column;gap:.35rem;font-size:.9rem;font-weight:600}.controls select,.controls input,.model-label select,.model-label input{width:100%;max-width:100%;border:1px solid var(--vp-c-divider);border-radius:9px;color:var(--vp-c-text-1);background:var(--vp-c-bg);padding:.64rem;font:inherit}.secondary{border-top:1px solid var(--vp-c-divider);padding-top:1rem}.model-label{max-width:450px;margin:.8rem 0}.fine{font-size:.85rem;color:var(--vp-c-text-2);line-height:1.65}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:.7rem;margin:1rem 0}.metrics>div{padding:1rem;border:1px solid var(--vp-c-divider);border-radius:11px;display:flex;flex-direction:column;gap:.25rem}.metrics span{color:var(--vp-c-text-2);font-size:.83rem}.metrics strong{font-size:1.18rem}.metrics .emphasis{background:var(--vp-c-brand-soft);border-color:var(--vp-c-brand-2)}.verdict{font-weight:600;padding:.7rem 1rem;border-left:3px solid var(--vp-c-brand-1);background:var(--vp-c-bg-soft)}.verdict.exceeds{border-left-color:var(--vp-c-danger-1)}.comparison{display:grid;gap:.7rem;margin:1rem 0}.item{border:1px solid var(--vp-c-divider);border-radius:10px;padding:.8rem 1rem}.item-head{display:flex;justify-content:space-between;gap:.6rem;flex-wrap:wrap}.item-head span{font-size:.77rem;color:var(--vp-c-text-2)}.item p{margin:.25rem 0}.next{font-weight:600}.error{color:var(--vp-c-danger-1)}details{border:1px solid var(--vp-c-divider);border-radius:10px;padding:1rem;margin:.7rem 0}summary{cursor:pointer}
</style>
