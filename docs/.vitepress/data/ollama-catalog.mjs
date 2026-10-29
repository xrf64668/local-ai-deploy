// Ollama 公开下载文件大小（十进制 GB）。用于跨架构容量初筛，非实测峰值。
// 对混合注意力、MoE、滑动窗口模型不得使用 Qwen2.5 全注意力 KV 公式。
export const OLLAMA_MODELS = Object.freeze([
  {
    "id": "q38",
    "name": "Qwen3.8 27B",
    "vendor": "Qwen",
    "tag": "qwen3.8:27b",
    "downloadGB": 18,
    "architecture": "hybrid",
    "usage": [
      "general",
      "code",
      "vision",
      "reasoning"
    ],
    "source": "https://ollama.com/library/qwen3.8:27b"
  },
  {
    "id": "q35",
    "name": "Qwen3.5 9B",
    "vendor": "Qwen",
    "tag": "qwen3.5:9b-q4_K_M",
    "downloadGB": 6.6,
    "architecture": "hybrid",
    "usage": [
      "general",
      "code",
      "vision"
    ],
    "source": "https://ollama.com/library/qwen3.5/tags"
  },
  {
    "id": "q3527",
    "name": "Qwen3.5 27B",
    "vendor": "Qwen",
    "tag": "qwen3.5:27b",
    "downloadGB": 20,
    "architecture": "hybrid",
    "usage": [
      "general",
      "code",
      "vision"
    ],
    "source": "https://ollama.com/library/qwen3.5"
  },
  {
    "id": "g4",
    "name": "Gemma 4 12B",
    "vendor": "Google",
    "tag": "gemma4:12b",
    "downloadGB": 8,
    "architecture": "sliding",
    "usage": [
      "general",
      "code",
      "vision",
      "reasoning"
    ],
    "source": "https://ollama.com/library/gemma4:12b"
  },
  {
    "id": "d14",
    "name": "DeepSeek-R1 Distill 14B",
    "vendor": "DeepSeek",
    "tag": "deepseek-r1:14b",
    "downloadGB": 9,
    "architecture": "dense",
    "usage": [
      "reasoning",
      "code",
      "general"
    ],
    "source": "https://ollama.com/library/deepseek-r1"
  },
  {
    "id": "d32",
    "name": "DeepSeek-R1 Distill 32B",
    "vendor": "DeepSeek",
    "tag": "deepseek-r1:32b",
    "downloadGB": 20,
    "architecture": "dense",
    "usage": [
      "reasoning",
      "code",
      "general"
    ],
    "source": "https://ollama.com/library/deepseek-r1"
  },
  {
    "id": "oss",
    "name": "gpt-oss 20B",
    "vendor": "OpenAI",
    "tag": "gpt-oss:20b",
    "downloadGB": 14,
    "architecture": "moe",
    "usage": [
      "reasoning",
      "code",
      "general"
    ],
    "source": "https://ollama.com/library/gpt-oss"
  },
  {
    "id": "llama",
    "name": "Llama 3.1 8B",
    "vendor": "Meta",
    "tag": "llama3.1:8b",
    "downloadGB": 4.9,
    "architecture": "dense",
    "usage": [
      "general",
      "code"
    ],
    "source": "https://ollama.com/library/llama3.1:8b"
  },
  {
    "id": "mistral",
    "name": "Mistral Small 3.1 24B",
    "vendor": "Mistral",
    "tag": "mistral-small3.1:24b",
    "downloadGB": 15,
    "architecture": "dense",
    "usage": [
      "general",
      "code",
      "vision"
    ],
    "source": "https://ollama.com/library/mistral-small3.1"
  },
  {
    "id": "q3",
    "name": "Qwen2.5 3B",
    "vendor": "Qwen",
    "tag": "qwen2.5:3b",
    "downloadGB": 1.9,
    "architecture": "dense",
    "usage": [
      "general"
    ],
    "source": "https://ollama.com/library/qwen2.5"
  },
  {
    "id": "q7",
    "name": "Qwen2.5 7B",
    "vendor": "Qwen",
    "tag": "qwen2.5:7b",
    "downloadGB": 4.7,
    "architecture": "dense",
    "usage": [
      "general",
      "code"
    ],
    "source": "https://ollama.com/library/qwen2.5"
  }
])
export function shortlistOllama({platform='mac',memoryGb=32,vramGb=12,systemReserveGb=4,gpuReserveGb=1.5,context=4096,concurrent=1,vendor='all',purpose='all'}={}){
  if (!['mac','ubuntu','windows'].includes(platform)) throw new RangeError('未知平台')
  if (![memoryGb,vramGb,systemReserveGb,gpuReserveGb].every(v=>Number.isFinite(v)&&v>=0)) throw new RangeError('内存参数无效')
  if (!Number.isInteger(context)||context<128||context>131072||!Number.isInteger(concurrent)||concurrent<1||concurrent>16) throw new RangeError('上下文或并发参数无效')
  const budgetGiB=Math.max(0,platform==='mac'?memoryGb-systemReserveGb:vramGb-gpuReserveGb)
  const round=n=>Math.round(n*100)/100
  const rows=OLLAMA_MODELS.filter(m=>(vendor==='all'||m.vendor===vendor)&&(purpose==='all'||m.usage.includes(purpose))).map(model=>{
    // 文件大小 + 工作区保护性余量 + 随上下文和并发增加的占位余量（不是 KV 估算）。
    const weightGiB=model.downloadGB*1e9/(1024**3)
    const reserveGiB=Math.max(1.5,weightGiB*0.2)+0.5*(context/4096)*concurrent
    const planningGiB=weightGiB+reserveGiB
    const rate=budgetGiB>0?planningGiB/budgetGiB:Infinity
    const tier=rate>1?'over':rate>.85?'tight':rate>.7?'possible':'roomy'
    return {model,weightGiB:round(weightGiB),reserveGiB:round(reserveGiB),planningGiB:round(planningGiB),remainingGiB:round(budgetGiB-planningGiB),tier}
  })
  return {rows,eligible:rows.filter(r=>r.tier!=='over').sort((a,b)=>b.model.downloadGB-a.model.downloadGB),over:rows.filter(r=>r.tier==='over'),budgetGiB:round(budgetGiB)}
}
