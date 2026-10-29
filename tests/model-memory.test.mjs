import test from 'node:test';
import assert from 'node:assert/strict';
import {MODEL_PROFILES,estimateLLM,assessBudget,recommendLLM} from '../docs/.vitepress/data/model-memory.mjs';

const small=MODEL_PROFILES.find(m=>m.id==='qwen25-3b'),large=MODEL_PROFILES.find(m=>m.id==='qwen25-7b');
test('模型元数据均满足基本的 KV 结构约束',()=>{
  for(const m of MODEL_PROFILES){assert.equal(m.hidden % m.heads,0);assert.ok(m.kvHeads<=m.heads);assert.ok(m.paramsB>0);}
});
test('同一模型更长上下文带来线性 KV 增长',()=>{
  const a=estimateLLM({model:small,context:4096});
  const b=estimateLLM({model:small,context:8192});
  assert.equal(b.kvGiB,a.kvGiB*2);
  assert.ok(b.totalGiB>a.totalGiB);
});
test('Q4 权重小于 Q8，实际 GGUF 文件大小优先',()=>{
  const a=estimateLLM({model:large,quant:'q4'});
  const b=estimateLLM({model:large,quant:'q8'});
  assert.ok(a.weightsGiB<b.weightsGiB);
  assert.equal(estimateLLM({model:large,actualWeightGiB:5.123}).weightsGiB,5.123);
});
test('并发增加影响 KV，不重复权重',()=>{
  const a=estimateLLM({model:small,concurrent:1});
  const b=estimateLLM({model:small,concurrent:4});
  assert.equal(a.weightsGiB,b.weightsGiB);
  assert.equal(b.kvGiB,a.kvGiB*4);
});
test('内存预算按平台区分，允许明确标示超出全 GPU 容量',()=>{
  const e=estimateLLM({model:large});
  const mac=assessBudget({estimate:e,platform:'mac',memoryGb:16,systemReserveGb:4});
  const gpu=assessBudget({estimate:e,platform:'ubuntu',vramGb:4,gpuReserveGb:1});
  assert.equal(mac.target,'统一内存');
  assert.equal(gpu.tier,'exceeds');
  assert.ok(mac.budgetGiB>gpu.budgetGiB);
});
test('异常输入被拒绝',()=>{
  assert.throws(()=>estimateLLM({model:small,context:0}),/上下文/);
  assert.throws(()=>estimateLLM({model:small,quant:'bad'}),/量化/);
  assert.throws(()=>estimateLLM({model:small,actualWeightGiB:-5}),/文件大小/);
});

const evaluateForMemory=(memoryGb,options={})=>recommendLLM(MODEL_PROFILES.map(model=>{
  const estimate=estimateLLM({model,quant:options.quant||'q4',context:options.context||4096,concurrent:options.concurrent||1});
  const budget=assessBudget({estimate,platform:'mac',memoryGb,systemReserveGb:4});
  return {model,estimate,budget};
}));
test('8/16/32/64GB 对应不同优先推荐和模型分档',()=>{
  for(const [memory,best] of [[8,'qwen25-3b'],[16,'qwen25-7b'],[32,'qwen25-14b'],[64,'qwen25-32b']]){
    assert.equal(evaluateForMemory(memory).best.model.id,best,memory+'GB 结果未随内存变化');
  }
  assert.ok(evaluateForMemory(8).insufficient.some(r=>r.model.id==='qwen25-32b'));
  assert.ok(evaluateForMemory(32).possible.some(r=>r.model.id==='qwen25-32b'));
  assert.ok(evaluateForMemory(64).possible.some(r=>r.model.id==='qwen25-72b'));
});
test('量化精度、上下文与并发变化影响实际分档',()=>{
  assert.notEqual(evaluateForMemory(16,{quant:'q4'}).best.model.id,evaluateForMemory(16,{quant:'f16'}).best.model.id);
  const short=evaluateForMemory(32,{context:2048}),long=evaluateForMemory(32,{context:32768,concurrent:4});
  assert.ok(long.insufficient.length>=short.insufficient.length);
  assert.ok(long.evaluated.find(r=>r.model.id==='qwen25-32b').estimate.kvGiB>short.evaluated.find(r=>r.model.id==='qwen25-32b').estimate.kvGiB);
});
test('七种规模以及低预算显示正确',()=>{
  assert.equal(MODEL_PROFILES.length,7);
  const rows=MODEL_PROFILES.map(model=>{
    const estimate=estimateLLM({model});
    return {model,estimate,budget:assessBudget({estimate,platform:'mac',memoryGb:2,systemReserveGb:4})};
  });
  assert.equal(recommendLLM(rows).best,null);
  assert.equal(recommendLLM(rows).insufficient.length,7);
});
