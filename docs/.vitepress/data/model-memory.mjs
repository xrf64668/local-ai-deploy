/**
 * 透明的 LLM 容量估算（非实测峰值）。
 * 来源：Qwen2.5 官方模型卡 + config.json；KV Cache 为逐层 K/V 张量计算式。
 * 计算全 GPU 放置场景，不推断 CPU Offload、多 GPU、吞吐或推理速度。
 */
export const MODEL_PROFILES = Object.freeze([
  {id:'qwen25-3b',name:'Qwen2.5 3B Instruct',paramsB:3.09,layers:36,heads:16,kvHeads:2,hidden:2048,source:'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct',guide:'/mac/models/ollama',maxContext:32768},
  {id:'qwen25-7b',name:'Qwen2.5 7B Instruct',paramsB:7.61,layers:28,heads:28,kvHeads:4,hidden:3584,source:'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct',guide:'/mac/models/ollama',maxContext:32768},
  {id:'qwen25-14b',name:'Qwen2.5 14B Instruct',paramsB:14.7,layers:48,heads:40,kvHeads:8,hidden:5120,source:'https://huggingface.co/Qwen/Qwen2.5-14B-Instruct-GGUF',guide:'/mac/models/ollama',maxContext:32768}
]);

// 量化格式平均每参数字节数的启发式近似。具体 GGUF 文件会混合精度、元数据和对齐。
export const QUANTIZATION = Object.freeze({
  q4: {name:'GGUF Q4_K_M（约 4.8 bit/参数）',bytes:0.60},
  q8: {name:'GGUF Q8_0（约 8.5 bit/参数）',bytes:1.0625},
  f16:{name:'FP16（16 bit/参数）',bytes:2}
});
const GIB=1024**3;
export const round2=n=>Math.round(n*100)/100;
const finitePos=(n,label)=>{if(!Number.isFinite(n)||n<=0)throw new RangeError(label+' 必须大于 0');return n};

/**
 * @param {object} args model, quant, context, concurrent, actualWeightGiB
 */
export function estimateLLM({model,quant='q4',context=4096,concurrent=1,actualWeightGiB=0}){
  if(!model || !Number.isInteger(model.layers)||!Number.isInteger(model.heads)||!Number.isInteger(model.kvHeads))throw new TypeError('模型架构缺少有效的层数/注意力头数');
  const paramsB=finitePos(Number(model.paramsB),'参数量');
  const layers=finitePos(model.layers,'层数'), heads=finitePos(model.heads,'注意力头数');
  const kvHeads=finitePos(model.kvHeads,'KV 头数'), hidden=finitePos(Number(model.hidden),'隐藏维度');
  if(hidden%heads!==0)throw new RangeError('隐藏维度必须能被注意力头数整除');
  if(!Number.isInteger(context)||context<128||context>131072)throw new RangeError('上下文需在 128～131072 之间');
  if(!Number.isInteger(concurrent)||concurrent<1||concurrent>16)throw new RangeError('并发会话需在 1～16 之间');
  const q=QUANTIZATION[quant]; if(!q)throw new RangeError('未知量化格式');
  if(!Number.isFinite(actualWeightGiB)||actualWeightGiB<0||actualWeightGiB>2048)throw new RangeError('文件大小不合法');
  const weight=actualWeightGiB>0?actualWeightGiB:paramsB*1e9*q.bytes/GIB;
  const headDim=hidden/heads;
  // K/V, layers, kv heads, head dim, context, 2 bytes FP16, and concurrent requests
  const kv=2*layers*kvHeads*headDim*context*2*concurrent/GIB;
  const workspace=Math.max(0.8,weight*0.15);
  return {
    weightsGiB:weight, kvGiB:kv, workspaceGiB:workspace,
    totalGiB:weight+kv+workspace,headDim,
    actualWeight:actualWeightGiB>0,
    quantization:quant,context,concurrent
  };
}
export function assessBudget({estimate,platform='mac',memoryGb=16,vramGb=8,systemReserveGb=4,gpuReserveGb=1}){
  if(!['mac','ubuntu','windows'].includes(platform))throw new RangeError('未知平台');
  for(const [value,name] of [[memoryGb,'内存'],[systemReserveGb,'系统预留'],[gpuReserveGb,'显存预留']]){
    if(!Number.isFinite(value)||value<0)throw new RangeError(name+' 不合法');
  }
  if(!Number.isFinite(vramGb)||vramGb<0)throw new RangeError('显存不合法');
  const target=platform==='mac'?'统一内存':'独立 GPU 显存';
  const budgetGiB=Math.max(0,platform==='mac'?memoryGb-systemReserveGb:vramGb-gpuReserveGb);
  const remainingGiB=budgetGiB-estimate.totalGiB;
  // 留出 15% 的不确定性空间，避免将接近上限的估算展示为“轻松运行”
  const tier=remainingGiB<0?'exceeds':estimate.totalGiB>budgetGiB*0.85?'tight':'candidate';
  return {target,budgetGiB,remainingGiB,tier};
}
