#!/usr/bin/env node
// Read-only HF Hub discovery. Never downloads weights or promotes models to verified.
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {resolve,dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const VALID_ID=/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/
export const validRepoId=id=>typeof id==='string'&&VALID_ID.test(id)&&!id.includes('..')
const fileName=s=>typeof s==='string'&&s.length<512?s:null

export function normalizeModel(info,{query=null,publisher='unreviewed'}={}){
  if(!info||!validRepoId(info.id))return null
  const files=Array.isArray(info.siblings)
    ? info.siblings.map(s=>fileName(s.rfilename)).filter(Boolean).sort()
    : []
  // Only surfaced metadata and names. No external code, untrusted markdown, or binary bytes.
  const sha=typeof info.sha==='string'&&/^[a-f0-9]{40}$/.test(info.sha)?info.sha:null
  const license=typeof info.cardData?.license==='string'?info.cardData.license.slice(0,100):null
  return {
    id:info.id,repositoryUrl:'https://huggingface.co/'+info.id,revision:sha,
    discoveryQuery:query,publisherClaim:publisher,
    license, gated:Boolean(info.gated),private:Boolean(info.private),
    pipelineTag:typeof info.pipeline_tag==='string'?info.pipeline_tag:null,
    library:typeof info.library_name==='string'?info.library_name:null,
    lastModified:typeof info.lastModified==='string'?info.lastModified:null,
    fileCount:files.length,files:files.slice(0,80),
    fileTypes:{
      gguf:files.some(x=>/\.gguf$/i.test(x)),
      safetensors:files.some(x=>/\.safetensors$/i.test(x)),
      config:files.some(x=>/(^|\/)config\.json$/.test(x)),
      vae:files.some(x=>/vae/i.test(x)),
      tokenizer:files.some(x=>/tokenizer/i.test(x))
    },
    // Finding files never establishes backend compatibility.
    reviewStatus:'discovered',runtimeVerified:false,hardwareVerified:false
  }
}

export function validateWatchlist(w){
  if(w?.schemaVersion!==1||!Array.isArray(w.repositories)||!Array.isArray(w.searches))throw Error('watchlist schema invalid')
  if(w.repositories.length>30||w.searches.length>12)throw Error('watchlist too large')
  for(const r of w.repositories)if(!validRepoId(r.id)||!['official','community-conversion'].includes(r.publisher))throw Error('invalid repository entry')
  for(const q of w.searches)if(typeof q.query!=='string'||q.query.length<2||q.query.length>60||!Number.isInteger(q.limit)||q.limit<1||q.limit>20)throw Error('invalid search entry')
  return true
}

export function mergeCandidates(rows){
  const grouped=new Map()
  for(const m of rows){
    if(!m)continue
    const original=grouped.get(m.id)
    if(!original||(original.publisherClaim==='unreviewed'&&m.publisherClaim!=='unreviewed'))grouped.set(m.id,m)
  }
  return [...grouped.values()].sort((a,b)=>a.id.localeCompare(b.id,'en'))
}

async function fetchJSON(url){
  let last
  for(let attempt=0;attempt<3;attempt++){
    try{
      const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'local-ai-deploy-metadata-discovery'},signal:AbortSignal.timeout(18000)})
      if(response.status===429||response.status>=500)throw new Error('HF API HTTP '+response.status)
      if(!response.ok)throw new Error('HF API HTTP '+response.status+' · '+url.pathname)
      return await response.json()
    }catch(err){last=err;if(attempt<2)await new Promise(r=>setTimeout(r,(attempt+1)*1500))}
  }
  throw last
}

async function discover(watchlist){
  const data=[],problems=[]
  const base='https://huggingface.co/api/models/'
  const requested=new Map()
  for(const r of watchlist.repositories)requested.set(r.id,{publisher:r.publisher,query:null})
  for(const q of watchlist.searches){
    const url=new URL('https://huggingface.co/api/models')
    url.searchParams.set('search',q.query)
    url.searchParams.set('sort','lastModified')
    url.searchParams.set('direction','-1')
    url.searchParams.set('limit',String(q.limit))
    try{
      const list=await fetchJSON(url)
      if(!Array.isArray(list))throw Error('Unexpected Hub search response')
      for(const m of list)if(validRepoId(m.id)&&!requested.has(m.id))requested.set(m.id,{publisher:'unreviewed',query:q.query})
    }catch(e){problems.push({source:'search:'+q.query,error:String(e.message||e).slice(0,250)})}
  }
  for(const [id,meta] of requested){
    try{
      const url=new URL(base+id.split('/').map(encodeURIComponent).join('/'))
      const info=await fetchJSON(url)
      const normalized=normalizeModel(info,meta)
      if(normalized)data.push(normalized)
    }catch(e){problems.push({source:'model:'+id,error:String(e.message||e).slice(0,250)})}
  }
  return {schemaVersion:1,generatedAt:new Date().toISOString(),source:'Hugging Face Hub public REST API',
    purpose:'discovery-only; not a verified model catalog',status:problems.length?'partial':'complete',
    counts:{requested:requested.size,found:data.length,errors:problems.length},
    candidates:mergeCandidates(data),errors:problems}
}

async function main(){
 const project=resolve(dirname(fileURLToPath(import.meta.url)),'..')
 const watchlist=JSON.parse(await readFile(resolve(project,'data/model-discovery/watchlist.json'),'utf8'))
 validateWatchlist(watchlist)
 const report=await discover(watchlist)
 const out=process.env.MODEL_DISCOVERY_OUT
   ?resolve(process.env.MODEL_DISCOVERY_OUT)
   :resolve(project,'artifacts/model-discovery.json')
 if(!out.startsWith(project+'/'))throw Error('Refusing to write outside repository')
 await mkdir(dirname(out),{recursive:true})
 await writeFile(out,JSON.stringify(report,null,2)+'\n')
 console.log('Models discovered: '+report.counts.found+' / '+report.counts.requested)
 console.log('API errors: '+report.counts.errors)
 console.log('Report: '+out)
 if(!report.candidates.length)throw Error('No models discovered; do not publish empty results')
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 main().catch(e=>{console.error(e);process.exitCode=1})
}
