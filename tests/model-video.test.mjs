import test from 'node:test'
import assert from 'node:assert/strict'
import {videoRecommendations,VIDEO_PROFILES} from '../docs/.vitepress/data/model-video.mjs'

test('Mac 32GB LTX2.5 与 Wan2.2 都在具体模型候选中',()=>{
 const rows=videoRecommendations({platform:'mac',memoryGb:32,diskGb:120})
 assert.equal(rows.find(r=>r.model.id==='ltx25-mlx-q4').eligible,true)
 const wan=rows.find(r=>r.model.id==='wan22-mlx-q8')
 assert.equal(wan.eligible,true)
 assert.equal(wan.state,'experimental')
})
test('Mac 16GB 只选轻量方案',()=>{
 const rows=videoRecommendations({platform:'mac',memoryGb:16,diskGb:120})
 assert.equal(rows.find(r=>r.model.id==='ltx23-mlx-q4').eligible,true)
 assert.equal(rows.find(r=>r.model.id==='ltx25-mlx-q4').eligible,false)
 assert.equal(rows.find(r=>r.model.id==='wan22-mlx-q8').eligible,false)
})
test('Mac 64GB Wan 有上游验证但仍需本机测试',()=>{
 const wan=videoRecommendations({platform:'mac',memoryGb:64,diskGb:120}).find(r=>r.model.id==='wan22-mlx-q8')
 assert.equal(wan.state,'candidate')
 assert.match(wan.status,/需本机测试/)
})
test('磁盘不足不会误推荐',()=>{
 const rows=videoRecommendations({platform:'mac',memoryGb:64,diskGb:25})
 assert.equal(rows.find(r=>r.model.id==='ltx25-mlx-q4').eligible,false)
 assert.equal(rows.find(r=>r.model.id==='wan22-mlx-q8').eligible,false)
})
test('NVIDIA 低显存不推荐 24GB 路线',()=>{
 for(const platform of ['ubuntu','windows']){
  assert.ok(videoRecommendations({platform,memoryGb:32,vramGb:12,diskGb:150}).every(r=>!r.eligible))
  const high=videoRecommendations({platform,memoryGb:32,vramGb:24,diskGb:150})
  assert.ok(high.some(r=>r.model.id==='ltx25-desktop-nvidia'&&r.eligible))
  assert.ok(high.some(r=>r.model.id==='wan22-ti2v5b-cuda'&&r.eligible))
 }
})
test('候选有权重来源和部署文档',()=>{
 for(const m of VIDEO_PROFILES){
  assert.match(m.evidenceUrl,/^https:\/\//)
  assert.match(m.modelUrl,/^https:\/\//)
  assert.ok(m.guide.startsWith('/'))
 }
})
