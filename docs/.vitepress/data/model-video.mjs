/** 上游资源参考，不属于视频峰值内存计算或本站实测。 */
export const VIDEO_PROFILES=Object.freeze([
{id:'ltx25-mlx-q4',title:'LTX-2.5 · MLX Q4',platforms:['mac'],backend:'ltx-2-mlx · 原生 MLX',minMemory:32,minVram:0,minSystem:0,diskGb:65,download:'约 42–47 GB',memoryReference:'上游建议 32GB+，可使用 --low-ram；先做短片验证',grade:'上游部署建议 · 需本机验证',rationale:'优先用 512×320、25 帧短片验证。模型包包含 dev、distilled 与文本编码器；下载量不等于运行峰值。',guide:'/mac/models/ltx25',modelUrl:'https://huggingface.co/dgrauet/ltx-2.5-mlx-q4',evidenceUrl:'https://github.com/dgrauet/ltx-2-mlx'},
{id:'wan22-mlx-q8',title:'Wan2.2 TI2V-5B · MLX Q8',platforms:['mac'],backend:'mlx-video · 原生 MLX',minMemory:32,validatedMemory:64,minVram:0,minSystem:0,diskGb:30,download:'约 19.6 GB',memoryReference:'模型卡建议 32GB+；64GB Mac 有验证记录',grade:'32GB 实验性 · 64GB 有上游记录',rationale:'32GB 仅列为低负载实验候选。上游 64GB 记录对应 720p/41 帧/20 步，不应直接套用于 32GB。',guide:'/mac/models/wan22',modelUrl:'https://huggingface.co/Anes1032/Wan2.2-TI2V-5B-mlx-q8',evidenceUrl:'https://huggingface.co/Anes1032/Wan2.2-TI2V-5B-mlx-q8'},
{id:'ltx23-mlx-q4',title:'LTX-2.3 · MLX Q4（轻量备选）',platforms:['mac'],backend:'ltx-2-mlx · 原生 MLX',minMemory:16,minVram:0,minSystem:0,diskGb:20,download:'约 12 GB',memoryReference:'上游说明 int4 可在 16GB+ 的 Mac 尝试',grade:'上游低内存方案 · 需本机验证',rationale:'若 LTX-2.5 的内存和下载量不合适，先尝试较轻的 LTX-2.3 Q4；模型代际及效果不同。',guide:'/guide/deploy',modelUrl:'https://huggingface.co/dgrauet/ltx-2.3-mlx-q4',evidenceUrl:'https://github.com/dgrauet/ltx-2-mlx'},
{id:'ltx25-desktop-nvidia',title:'LTX-2.5 · LTX Desktop',platforms:['ubuntu','windows'],backend:'LTX Desktop · NVIDIA CUDA',minMemory:0,minVram:24,minSystem:32,diskGb:100,download:'按需下载；官方建议 100GB+ 可用磁盘',memoryReference:'官方要求 NVIDIA 24GB+ 显存、32GB 系统内存',grade:'官方桌面版资源要求',rationale:'依照 LTX Desktop 官方系统要求初筛。具体 GPU 型号、驱动、生成时长仍需检查。',guide:'/guide/model-download',modelUrl:'https://github.com/Lightricks/LTX-Desktop',evidenceUrl:'https://github.com/Lightricks/LTX-Desktop/blob/main/docs/setup-and-settings.md'},
{id:'wan22-ti2v5b-cuda',title:'Wan2.2 TI2V-5B · CUDA 原版',platforms:['ubuntu','windows'],backend:'PyTorch CUDA / 对应 ComfyUI 工作流',minMemory:0,minVram:24,minSystem:16,diskGb:50,download:'按原版模型仓库及工作流文件列表核对',memoryReference:'24GB 显存路线通常需要卸载模型、调整 dtype 和 T5 CPU 设置',grade:'上游资源路线 · 需工作流验证',rationale:'这里使用 PyTorch 原版而非 Mac MLX Q8；24GB 属于特定卸载参数下的部署起点。',guide:'/guide/model-download',modelUrl:'https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B',evidenceUrl:'https://github.com/Wan-Video/Wan2.2'}
]);
export function videoRecommendations({platform='mac',memoryGb=32,vramGb=12,diskGb=120}={}){
 if(!['mac','ubuntu','windows'].includes(platform))throw new RangeError('未知系统')
 if(![memoryGb,vramGb,diskGb].every(x=>Number.isFinite(x)&&x>=0))throw new RangeError('硬件输入不合法')
 return VIDEO_PROFILES.filter(m=>m.platforms.includes(platform)).map(model=>{
  const memoryOk=platform==='mac'?memoryGb>=model.minMemory:memoryGb>=model.minSystem;
  const vramOk=platform==='mac'||vramGb>=model.minVram;
  const diskOk=diskGb>=model.diskGb;
  const eligible=memoryOk&&vramOk&&diskOk;
  const reasons=[];
  if(!memoryOk)reasons.push(platform==='mac'?`统一内存低于参考起点 ${model.minMemory}GB`:`系统内存低于参考起点 ${model.minSystem}GB`);
  if(!vramOk)reasons.push(`显存低于参考起点 ${model.minVram}GB`);
  if(!diskOk)reasons.push(`可用磁盘建议至少 ${model.diskGb}GB`);
  const state=!eligible?'needs-review':model.validatedMemory&&memoryGb<model.validatedMemory?'experimental':'candidate';
  const status=!eligible?'当前配置不满足参考要求':state==='experimental'?'实验性候选 · 需本机测试':'部署候选 · 需本机测试';
  return {model,eligible,state,status,reasons};
 })
}
