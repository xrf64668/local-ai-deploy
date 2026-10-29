import test from 'node:test';
import assert from 'node:assert/strict';
import {MODEL_PROFILES,estimateLLM,assessBudget} from '../docs/.vitepress/data/model-memory.mjs';

const small=MODEL_PROFILES[0],large=MODEL_PROFILES[1];
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
