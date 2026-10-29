<script setup>
import {computed,ref,watch} from 'vue'
import {withBase} from 'vitepress'
import {MODEL_PROFILES,QUANTIZATION,estimateLLM,assessBudget,round2,recommendLLM} from '../../data/model-memory.mjs'
import {videoRecommendations} from '../../data/model-video.mjs'
import {OLLAMA_MODELS,shortlistOllama} from '../../data/ollama-catalog.mjs'

const props=defineProps({
  initialPlatform:{type:String,default:'mac'},
  lockPlatform:{type:Boolean,default:false}
});
const platform=ref(props.initialPlatform)
const chip=ref('M4')
const task=ref('llm')
const memory=ref(32)
const vram=ref(12)
const freeDisk=ref(120)
const reserve=ref(4)
const gpuReserve=ref(1.5)
const quant=ref('q4')
const context=ref(4096)
const concurrent=ref(1)
const selectedId=ref('qwen25-7b')
const actualFile=ref(0)
const custom=ref({paramsB:8,layers:32,hidden:4096,heads:32,kvHeads:8})
const selectedVendor=ref('all')
const selectedPurpose=ref('all')
const vendorOptions=['all',...new Set(OLLAMA_MODELS.map(m=>m.vendor))]
const modernAdvice=computed(()=>shortlistOllama({platform:platform.value,memoryGb:Number(memory.value),vramGb:Number(vram.value),systemReserveGb:Number(reserve.value),gpuReserveGb:Number(gpuReserve.value),context:context.value,concurrent:concurrent.value,vendor:selectedVendor.value,purpose:selectedPurpose.value}))
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
const llmAdvice=computed(()=>recommendLLM(results.value))
// 更换硬件/量化/上下文时同步“详细分析”的模型，避免保留上一档 7B 而让用户误解。
watch([platform,memory,vram,reserve,gpuReserve,quant,context,concurrent],()=>{
  const best=llmAdvice.value.best
  if(best){
    selectedId.value=best.model.id
    actualFile.value=0
  }
})
const numberOfModels=computed(()=>llmAdvice.value.priority.length+llmAdvice.value.possible.length+llmAdvice.value.cautious.length)
const videoRows=computed(()=>videoRecommendations({platform:platform.value,memoryGb:Number(memory.value),vramGb:Number(vram.value),diskGb:Number(freeDisk.value)}))
const videoCandidates=computed(()=>videoRows.value.filter(row=>row.eligible))
const videoUnavailable=computed(()=>videoRows.value.filter(row=>!row.eligible))
const taskRoutes=computed(()=>{
  const p=platform.value
  if(task.value==='image')return {title:'ComfyUI：首次安装并生成图片',primary:p==='mac'?'/comfyui/mac':p==='ubuntu'?'/comfyui/ubuntu':'/comfyui/windows',secondary:'/comfyui/first-workflow',note:'图像峰值显存依赖工作流、分辨率、VAE、模型和节点，当前不使用语言模型的 KV 缓存公式计算。'}
  if(task.value==='video')return {title:'ComfyUI 视频工作流与模型匹配',primary:p==='mac'?'/mac/models/ltx25':p==='ubuntu'?'/comfyui/ubuntu':'/comfyui/windows',secondary:'/comfyui/models-and-paths',note:'视频峰值还取决于帧数、分辨率、注意力实现与卸载方式。本站暂不输出伪精确的“需要 X GB”结论。'}
  return {title:'Whisper：本地语音识别',primary:'/guide/choose-tool',secondary:'/guide/hardware',note:'语音模型的可运行资源与实现相关，需按选定模型和设备进行实测，不能套用 LLM 的 KV 缓存公式。'}
})
const label=t=>t==='candidate'?'具有进一步验证的容量空间':t==='tight'?'接近可用上限，建议谨慎尝试':'超出当前全 GPU 预算'
const deployment=computed(()=>platform.value==='mac'?'/mac/models/ollama':platform.value==='ubuntu'?'/ubuntu/ollama':'/windows/ollama')
// 把当前访客输入带到独立下载路线。仅使用站点白名单中的模型 ID。
const plannerLink=id=>'/guide/deploy?'+new URLSearchParams({platform:platform.value,memory:String(memory.value),vram:String(vram.value),disk:String(freeDisk.value),model:id}).toString()
</script>

<template>
  <section class="calculator" aria-label="本地模型硬件容量计算器">
    <p class="notice"><strong>默认选项只是填写示例，不代表网站识别了你的硬件。</strong> 当前访客应先选择自己的系统与配置。 你修改硬件、任务和上下文后，模型候选会随之变化；传统架构详细计算可在下方展开。结果属于<strong>容量估算</strong>，不是自动读取硬件或已通过实际推理的证明。</p>
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
          <option value="video">视频生成（推荐 LTX / Wan 等模型）</option>
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

    <div v-if="task==='video'" class="controls secondary">
      <label>预计可用磁盘空间
        <select v-model.number="freeDisk">
          <option v-for="n in [20,30,40,60,80,100,120,160,256,512]" :key="n" :value="n">{{ n }} GB</option>
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
      <p class="fine">{{ platform==='mac'?chip+' · 使用统一内存作为容量预算。':'使用单张 NVIDIA 显卡的显存预算。' }} 上下文和并发影响容量初筛；量化下拉框仅作用于下方可展开的传统 Transformer 详细计算，不会改变上方 Ollama 模型标签本身的量化精度。</p>

      <section class="multi-vendor-recommendations" aria-label="跨厂商模型推荐结果">
        <h3>不同厂商的本地模型推荐</h3>
        <p class="fine">已收录 {{ OLLAMA_MODELS.length }} 个可在 Ollama 模型库核对的具体标签，包含 Qwen3.8、Gemma、DeepSeek、gpt-oss、Llama 和 Mistral。先按任务选模型，再看你的内存是否适合进一步尝试。</p>
        <div class="controls">
          <label>模型厂商
            <select v-model="selectedVendor">
              <option v-for="v in vendorOptions" :key="v" :value="v">{{ v==='all'?'全部厂商':v }}</option>
            </select>
          </label>
          <label>主要用途
            <select v-model="selectedPurpose">
              <option value="all">不限用途</option>
              <option value="general">聊天与通用任务</option>
              <option value="code">编程与 Agent</option>
              <option value="reasoning">复杂推理</option>
              <option value="vision">图片理解</option>
            </select>
          </label>
        </div>
        <p class="fine">当前可用预算约 <strong>{{ modernAdvice.budgetGiB }} GiB</strong>；有进一步尝试空间的模型 <strong>{{ modernAdvice.eligible.length }} 个</strong>。以下使用 <strong>Ollama 官方标签的下载文件大小</strong>，再加工作区及随上下文增加的保护性余量。<strong>这是跨架构容量初筛，不是精确显存/KV 计算，也不是模型质量排名。</strong></p>
        <div class="catalog-cards" v-if="modernAdvice.eligible.length">
          <article v-for="row in modernAdvice.eligible" :key="row.model.id" class="catalog-card">
            <div class="catalog-card-heading">
              <strong>{{ row.model.name }}</strong>
              <span>{{ row.model.vendor }} · {{ row.tier==='roomy'?'预算余量较多':row.tier==='possible'?'可以尝试':'接近预算上限' }}</span>
            </div>
            <p class="catalog-model-tag"><code>ollama run {{ row.model.tag }}</code></p>
            <p class="fine">官方标签下载约 {{ row.model.downloadGB }} GB · 规划占用约 {{ row.planningGiB }} GiB · 预算剩余 {{ row.remainingGiB }} GiB</p>
            <p class="fine">架构：{{ row.model.architecture }}。复杂架构的运行峰值需用真实任务验证。</p>
            <div class="catalog-links">
              <a :href="row.model.source" target="_blank" rel="noopener noreferrer">查看官方模型标签 ↗</a>
              <a :href="withBase(plannerLink(row.model.id))">按这台设备生成下载命令 →</a>
            </div>
          </article>
        </div>
        <p v-else class="fine">当前筛选条件下，没有足够预算的候选。可以降低模型文件规模，或者查看下面的容量不足列表。</p>
        <details v-if="modernAdvice.over.length" class="unavailable-models">
          <summary>查看当前规划预算不足的模型（{{ modernAdvice.over.length }}）</summary>
          <div v-for="row in modernAdvice.over" :key="row.model.id" class="unavailable-row">
            <strong>{{ row.model.name }}</strong>
            <p class="fine">下载约 {{ row.model.downloadGB }} GB · 规划占用 {{ row.planningGiB }} GiB，超过预算约 {{ round2(-row.remainingGiB) }} GiB。</p>
            <a :href="row.model.source" target="_blank" rel="noopener noreferrer">模型来源 ↗</a>
          </div>
        </details>
        <p class="fine">特别提醒：Qwen3.8 等混合架构、gpt-oss 的 MoE 以及 Gemma 4 的滑动窗口，不能直接套用传统 Transformer 的全部 KV 计算。此处保护性余量为规划假设，不保证上下文实际可用；下载体积与 GPU 实际驻留量也不等价。</p>
      </section>

      <details class="legacy-estimator">
        <summary>进阶：展开 Qwen2.5 传统 Transformer 的精细计算与自定义模型</summary>
        <p class="fine">下面是用于理解权重、传统 FP16 KV 缓存、层数与头数关系的计算器，只包含已录入结构的 Qwen2.5 及自定义标准 Transformer。上面的跨厂商推荐使用各模型的实际 Ollama 标签与独立的容量初筛，不应把两者的数字当成同一精度。</p>
      <section class="llm-recommendations" aria-label="按内存实时筛选的语言模型">
        <h3>当前硬件的模型推荐结果</h3>
        <p class="fine">已根据当前 {{ platform==='mac'?'统一内存':'GPU 显存' }} 和系统预留，筛选 {{ MODEL_PROFILES.length }} 个模型规模中的 <strong>{{ numberOfModels }} 个容量候选</strong>。这里对比的是 Q4/Q8/FP16 权重、上下文和缓存占用，不是模型能力排行榜。</p>
        <div v-if="llmAdvice.best" class="recommend-highlight">
          <div><span class="highlight-overline">当前容量档位建议先关注</span><h4>{{ llmAdvice.best.model.name }}</h4></div>
          <p>预计使用 <strong>{{ round2(llmAdvice.best.estimate.totalGiB) }} GiB</strong>，预算剩余 <strong>{{ round2(llmAdvice.best.budget.remainingGiB) }} GiB</strong>。这里选择的是<strong>不超过约 70% 预算的最大参数模型</strong>；若没有这样的模型，则依次考虑更接近上限的候选。</p>
          <a :href="withBase(deployment)">查看对应系统 Ollama 部署步骤 →</a>
        </div>
        <p v-else class="notice">当前预算下没有合适的全 GPU 容量候选。请降低上下文、量化精度、并发数，或检查设备预留空间。</p>

        <div v-if="llmAdvice.priority.length" class="rank-group" aria-label="优先推荐的模型">
          <h4>优先推荐 · 估算占预算 70% 以内（{{ llmAdvice.priority.length }}）</h4>
          <div class="recommendation-rows">
            <div v-for="row in llmAdvice.priority" :key="row.model.id" class="recommendation-row">
              <strong>{{ row.model.name }}</strong>
              <span>估算 {{ round2(row.estimate.totalGiB) }} GiB · 剩余 {{ round2(row.budget.remainingGiB) }} GiB</span>
              <a :href="withBase(deployment)">部署教程</a>
            </div>
          </div>
        </div>
        <div v-if="llmAdvice.possible.length" class="rank-group" aria-label="可以尝试的模型">
          <h4>可以尝试 · 预算占用 70%–85%（{{ llmAdvice.possible.length }}）</h4>
          <div class="recommendation-rows">
            <div v-for="row in llmAdvice.possible" :key="row.model.id" class="recommendation-row">
              <strong>{{ row.model.name }}</strong>
              <span>估算 {{ round2(row.estimate.totalGiB) }} GiB · 剩余 {{ round2(row.budget.remainingGiB) }} GiB</span>
              <a :href="withBase(deployment)">部署教程</a>
            </div>
          </div>
        </div>
        <div v-if="llmAdvice.cautious.length" class="rank-group caution-group" aria-label="接近内存上限的模型">
          <h4>谨慎尝试 · 预算占用 85%–100%（{{ llmAdvice.cautious.length }}）</h4>
          <div class="recommendation-rows">
            <div v-for="row in llmAdvice.cautious" :key="row.model.id" class="recommendation-row">
              <strong>{{ row.model.name }}</strong>
              <span>估算 {{ round2(row.estimate.totalGiB) }} GiB · 剩余 {{ round2(row.budget.remainingGiB) }} GiB</span>
              <a :href="withBase(deployment)">部署教程</a>
            </div>
          </div>
        </div>
        <details v-if="llmAdvice.insufficient.length" class="unavailable-models">
          <summary>当前全 GPU 预算不足的模型（{{ llmAdvice.insufficient.length }}）</summary>
          <div v-for="row in llmAdvice.insufficient" :key="row.model.id" class="unavailable-row">
            <strong>{{ row.model.name }}</strong>
            <p class="fine">估算 {{ round2(row.estimate.totalGiB) }} GiB，超过预算约 {{ round2(-row.budget.remainingGiB) }} GiB；可能需要其他量化或部分 CPU 卸载路线。</p>
          </div>
        </details>
        <p class="fine">切换内存、显存、量化、上下文或并发，以上结果会立即更新。70% / 85% 是本站为了保留运行余量设置的分档线，<strong>不代表官方最低配置或模型效果评测</strong>。芯片系列选项暂不参与性能或速度计算。</p>
      </section>

      <h3>单个经典模型的详细内存计算</h3>
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

      <details class="all-models">
        <summary>查看全部 {{ MODEL_PROFILES.length }} 个模型的权重、KV 缓存与工作区拆分</summary>
        <div class="comparison">
          <div v-for="row in llmAdvice.evaluated" :key="row.model.id" class="item">
            <div class="item-head"><strong>{{ row.model.name }}</strong><span>{{ row.tier==='insufficient'?'预算不足':row.tier==='caution'?'谨慎尝试':row.tier==='possible'?'可以尝试':'优先推荐' }}</span></div>
            <p class="fine">权重 {{ round2(row.estimate.weightsGiB) }} + KV {{ round2(row.estimate.kvGiB) }} + 工作区 {{ round2(row.estimate.workspaceGiB) }} = <strong>{{ round2(row.estimate.totalGiB) }} GiB</strong></p>
          </div>
        </div>
      </details>
      <p class="fine">详情中的真实权重文件大小只影响所选模型的单项分析；上方跨模型推荐继续使用统一的量化近似值，便于公平对比。</p>
      </details>
    </template>
    <template v-else-if="task==='video'">
      <h3>根据当前配置推荐的视频模型（{{ videoCandidates.length }}）</h3>
      <p class="fine">已结合系统、统一内存或显存、系统内存及可用磁盘筛选具体的 LTX / Wan 模型版本。推荐依据来自上游适配说明，<strong>不是通过 LLM KV 公式计算视频峰值内存</strong>。</p>
      <div v-if="videoCandidates.length" class="video-models" aria-label="LTX 与 Wan 视频模型推荐结果">
        <article v-for="row in videoCandidates" :key="row.model.id" class="video-model-card">
          <div class="video-title">
            <h4>{{ row.model.title }}</h4>
            <span class="video-state" :class="row.state">{{ row.status }}</span>
          </div>
          <p class="video-backend">{{ row.model.backend }}</p>
          <p>{{ row.model.rationale }}</p>
          <dl class="video-specs">
            <div><dt>模型包下载量</dt><dd>{{ row.model.download }}</dd></div>
            <div><dt>硬件依据</dt><dd>{{ row.model.memoryReference }}</dd></div>
            <div><dt>磁盘参考余量</dt><dd>至少 {{ row.model.diskGb }} GB（包含缓存与输出预留）</dd></div>
          </dl>
          <p class="fine">{{ row.model.grade }}。实际兼容性还需按具体版本、分辨率和帧数实测。</p>
          <div class="video-links">
            <a :href="withBase(plannerLink(row.model.id))">按当前硬件查看下载命令 →</a>
            <a :href="row.model.modelUrl" target="_blank" rel="noopener noreferrer">模型来源 ↗</a>
            <a :href="row.model.evidenceUrl" target="_blank" rel="noopener noreferrer">查看依据 ↗</a>
          </div>
        </article>
      </div>
      <p v-else class="notice">当前输入的内存、显存和磁盘条件下，目录中暂时没有符合上游参考条件的视频模型。可查看下面的未满足条件说明；这不代表其他高度优化方案完全无法运行。</p>
      <details v-if="videoUnavailable.length" class="unavailable-models">
        <summary>查看未满足参考条件的模型（{{ videoUnavailable.length }}）</summary>
        <div v-for="row in videoUnavailable" :key="row.model.id" class="unavailable-row">
          <strong>{{ row.model.title }}</strong>
          <p class="fine">{{ row.reasons.join('；') }}。<a :href="row.model.evidenceUrl" target="_blank" rel="noopener noreferrer">原始资源依据 ↗</a></p>
        </div>
      </details>
      <p class="fine" v-if="platform==='mac'">这里优先列出<strong>原生 MLX</strong> 版本。想通过 ComfyUI 运行视频模型，可另外阅读 <a :href="withBase('/comfyui/mac')">Mac ComfyUI 教程</a>；ComfyUI 的 PyTorch 权重通常不能直接复用这里的 MLX 转换权重。</p>
      <p class="fine" v-else>这些是 NVIDIA / CUDA 方案，与 Mac 的 MLX 权重不同。可先查看 <a :href="withBase(platform==='windows'?'/comfyui/windows':'/comfyui/ubuntu')">对应系统的 ComfyUI 部署步骤</a>，再按上游模型要求选择工作流。</p>
      <p class="fine">磁盘余量是留给模型包、缓存和生成文件的保守规划值，<strong>不是模型实际显存峰值</strong>。改变硬件选择后会重新筛选；没有实机日志时不会声称“保证运行”。</p>
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
 .video-models{display:grid;gap:1rem;margin:1rem 0}.video-model-card{border:1px solid var(--vp-c-divider);border-radius:13px;padding:1.2rem;background:var(--vp-c-bg-soft)}.video-title{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:.65rem}.video-title h4{margin:0;font-size:1.07rem}.video-state{font-size:.79rem;border:1px solid var(--vp-c-divider);border-radius:99px;padding:.2rem .6rem}.video-state.experimental{color:var(--vp-c-warning-1)}.video-backend{font-weight:600;margin:.55rem 0;color:var(--vp-c-text-2)}.video-specs{display:grid;gap:.5rem;margin:.9rem 0}.video-specs div{display:grid;grid-template-columns:minmax(95px,130px) 1fr;gap:.65rem}.video-specs dt{font-size:.87rem;color:var(--vp-c-text-2)}.video-specs dd{margin:0;font-size:.89rem}.video-links{display:flex;gap:1rem;flex-wrap:wrap;font-size:.88rem;font-weight:600}.unavailable-models{margin:1.2rem 0}.unavailable-row{padding:.5rem 0;border-bottom:1px solid var(--vp-c-divider)}.unavailable-row:last-child{border-bottom:0}

.llm-recommendations{border-top:1px solid var(--vp-c-divider);margin-top:1.4rem;padding-top:1rem}
.recommend-highlight{padding:1.2rem;border:1px solid var(--vp-c-brand-2);background:var(--vp-c-brand-soft);border-radius:13px;margin:1rem 0}
.highlight-overline{color:var(--vp-c-text-2);font-size:.8rem}
.recommend-highlight h4{font-size:1.24rem;margin:.25rem 0}.recommend-highlight p{margin:.7rem 0}
.rank-group{margin:1.25rem 0}.rank-group h4{font-size:.96rem;margin:.6rem 0}.caution-group h4{color:var(--vp-c-warning-1)}
.recommendation-rows{display:grid;gap:.5rem}
.recommendation-row{display:grid;grid-template-columns:minmax(150px,1.2fr) minmax(125px,1fr) auto;align-items:center;gap:.6rem;padding:.75rem 1rem;border:1px solid var(--vp-c-divider);border-radius:10px}
.recommendation-row span{font-size:.83rem;color:var(--vp-c-text-2)}.recommendation-row a{font-size:.85rem;white-space:nowrap}
.all-models{margin:1.25rem 0}
@media(max-width:720px){.recommendation-row{grid-template-columns:1fr}.recommendation-row a{justify-self:start}}

.multi-vendor-recommendations{border-top:1px solid var(--vp-c-divider);padding-top:1.05rem}
.catalog-cards{display:grid;gap:.7rem;margin:1rem 0}
.catalog-card{border:1px solid var(--vp-c-divider);border-radius:12px;padding:1rem;background:var(--vp-c-bg-soft)}
.catalog-card-heading{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.4rem}
.catalog-card-heading strong{font-size:1.05rem}
.catalog-card-heading span{font-size:.8rem;color:var(--vp-c-text-2)}
.catalog-card p{margin:.4rem 0}.catalog-model-tag code{font-size:.9rem}
.catalog-links{display:flex;gap:1rem;flex-wrap:wrap;font-size:.87rem;font-weight:600;margin-top:.5rem}
.legacy-estimator{margin:1.6rem 0;border:1px solid var(--vp-c-divider);padding:1rem;border-radius:12px}
.legacy-estimator>summary{cursor:pointer;font-weight:600}
</style>
