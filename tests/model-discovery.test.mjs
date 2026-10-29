import test from 'node:test'
import assert from 'node:assert/strict'
import {normalizeModel,validateWatchlist,mergeCandidates,validRepoId} from '../scripts/model-discovery.mjs'
test('only valid two-segment Hub IDs are accepted',()=>{
 assert.equal(validRepoId('Qwen/Qwen3.8-27B'),true)
 for(const id of ['../../x','https://example.com/a','a/b/c','a/../b','a b/c'])assert.equal(validRepoId(id),false)
})
test('metadata-only discovery never implies verified backend or device',()=>{
 const m=normalizeModel({id:'dgrauet/ltx-2.5-mlx-q4',sha:'a'.repeat(40),cardData:{license:'custom'},siblings:[
  {rfilename:'transformer-dev.safetensors'}, {rfilename:'text_encoder.safetensors'}, {rfilename:'embedded_config.json'}]},{publisher:'community-conversion'})
 assert.equal(m.reviewStatus,'discovered')
 assert.equal(m.runtimeVerified,false)
 assert.equal(m.hardwareVerified,false)
 assert.equal(m.fileTypes.safetensors,true)
 assert.equal(m.fileTypes.config,false)
 assert.equal(m.license,'custom')
 assert.equal(m.revision,'a'.repeat(40))
})
test('deduplicate in favor of explicitly watched publisher without claiming verification',()=>{
 const a=normalizeModel({id:'Qwen/Qwen3.8-27B',sha:'b'.repeat(40)})
 const b=normalizeModel({id:'Qwen/Qwen3.8-27B',sha:'b'.repeat(40)},{publisher:'official'})
 const rows=mergeCandidates([a,b])
 assert.equal(rows.length,1)
 assert.equal(rows[0].publisherClaim,'official')
 assert.equal(rows[0].hardwareVerified,false)
})
test('watchlist bounded, rejects untrusted arbitrary config',()=>{
 assert.equal(validateWatchlist({schemaVersion:1,repositories:[{id:'Qwen/Qwen3.8-27B',publisher:'official'}],searches:[{query:'Wan',limit:5}]}),true)
 assert.throws(()=>validateWatchlist({schemaVersion:1,repositories:[],searches:[{query:'x',limit:500}]}))
})
