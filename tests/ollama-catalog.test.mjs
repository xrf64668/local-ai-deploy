import test from 'node:test'
import assert from 'node:assert/strict'
import {OLLAMA_MODELS,shortlistOllama} from '../docs/.vitepress/data/ollama-catalog.mjs'
test('Qwen3.8-27B 和多个厂商在目录内',()=>{
 assert.ok(OLLAMA_MODELS.some(m=>m.tag==='qwen3.8:27b'))
 assert.ok(new Set(OLLAMA_MODELS.map(m=>m.vendor)).size>=5)
 for(const m of OLLAMA_MODELS){assert.ok(m.source.startsWith('https://ollama.com/'));assert.ok(m.downloadGB>0)}
})
test('Mac 32GB 可以初筛 Qwen3.8, 8GB 不推荐',()=>{
 assert.notEqual(shortlistOllama({memoryGb:32}).rows.find(r=>r.model.id==='q38').tier,'over')
 assert.equal(shortlistOllama({memoryGb:8}).rows.find(r=>r.model.id==='q38').tier,'over')
})
test('Qwen3.8 64GB 的容量余量大于 32GB',()=>{
 const a=shortlistOllama({memoryGb:32}).rows.find(r=>r.model.id==='q38')
 const b=shortlistOllama({memoryGb:64}).rows.find(r=>r.model.id==='q38')
 assert.ok(b.remainingGiB>a.remainingGiB)
})
test('按厂商和用途筛选实际更换结果',()=>{
 assert.ok(shortlistOllama({vendor:'Google'}).rows.every(r=>r.model.vendor==='Google'))
 assert.ok(shortlistOllama({purpose:'reasoning'}).rows.every(r=>r.model.usage.includes('reasoning')))
})
test('显存与上下文影响初筛但不伪称精确 KV',()=>{
 assert.ok(shortlistOllama({platform:'ubuntu',vramGb:24}).eligible.length>shortlistOllama({platform:'ubuntu',vramGb:8}).eligible.length)
 const a=shortlistOllama({context:4096}).rows[0],b=shortlistOllama({context:32768}).rows[0]
 assert.ok(b.planningGiB>a.planningGiB)
})
