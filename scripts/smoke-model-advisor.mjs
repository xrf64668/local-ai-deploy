// Browser smoke test for the interactive public documentation.
// Uses Node.js 22 WebSocket + Chrome DevTools; no additional npm dependency.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const previewUrl = 'http://127.0.0.1:4173/local-ai-deploy'
const debuggerUrl = 'http://127.0.0.1:9229'
const browser = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']
  .find(name => spawnSync(name, ['--version'], {stdio:'ignore'}).status === 0)
assert.ok(browser, '找不到 Chrome/Chromium：无法执行浏览器交互检查')
const profile = mkdtempSync(join(tmpdir(), 'local-ai-smoke-'))
let preview, chrome, ws

async function retry(action, label, seconds = 40) {
  let latest
  for (let i = 0; i < seconds * 5; i++) {
    try {
      const result = await action()
      if (result !== false && result !== undefined && result !== null) return result
    } catch (error) { latest = error }
    await sleep(200)
  }
  throw new Error(label + '：等待超时' + (latest ? ' · ' + latest.message : ''))
}

function cdp(socket) {
  let seq = 0
  const pending = new Map()
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (!message.id || !pending.has(message.id)) return
    const task = pending.get(message.id)
    pending.delete(message.id)
    clearTimeout(task.timer)
    if (message.error) task.reject(new Error(JSON.stringify(message.error)))
    else task.resolve(message.result)
  })
  return (method, params={}) => new Promise((resolve,reject) => {
    const id = ++seq
    const timer = setTimeout(() => {pending.delete(id); reject(new Error('CDP ' + method + ' timeout'))}, 10000)
    pending.set(id, {resolve,reject,timer})
    socket.send(JSON.stringify({id,method,params}))
  })
}

try {
  preview = spawn('npm', ['run','docs:preview','--','--host','127.0.0.1','--port','4173'], {stdio:'ignore'})
  await retry(async () => {
    const res = await fetch(previewUrl+'/recommend/')
    return res.ok
  }, 'VitePress 预览服务启动')
  chrome = spawn(browser, [
    '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--no-first-run','--no-default-browser-check','--remote-allow-origins=*',
    '--remote-debugging-port=9229','--user-data-dir='+profile,'about:blank'
  ],{stdio:'ignore'})
  const target = await retry(async () => {
    const res = await fetch(debuggerUrl+'/json/new?about:blank', {method:'PUT'})
    if (!res.ok) return false
    const data = await res.json()
    return data.webSocketDebuggerUrl ? data : false
  }, 'Chrome 调试端口')
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve,reject) => {
    ws.addEventListener('open',resolve,{once:true})
    ws.addEventListener('error',reject,{once:true})
  })
  const cmd = cdp(ws)
  await cmd('Page.enable')
  await cmd('Runtime.enable')
  const evaluate = async expression => {
    const response = await cmd('Runtime.evaluate',{expression,returnByValue:true})
    if (response.exceptionDetails) throw new Error('浏览器 JS 异常: '+response.exceptionDetails.text)
    return response.result.value
  }
  const navigate = async path => {
    await cmd('Page.navigate',{url:previewUrl+path})
    await retry(() => evaluate("document.readyState === 'complete' && !!document.querySelector('#app')?.__vue_app__"),'客户端 Hydration')
  }
  await navigate('/recommend/')
  assert.ok(await retry(() => evaluate("!!document.querySelector('.calculator') && !!document.querySelector('.verdict')"), '计算器显示'))
  assert.ok(await evaluate("document.body.innerText.includes('不同厂商的本地模型推荐') && !!document.querySelector('.catalog-card')"),'初始跨厂商模型推荐未显示')
  console.log('[PASS] 浏览器显示 Mac 默认容量计算器')
  assert.ok(await evaluate("!!document.querySelector('.calculator') && !!document.querySelector('details.custom-block.details')"),'交互面板及固定排障入口都应存在')
  console.log('[PASS] 计算面板正常挂载并替换加载兜底')

  const selectedPlatform = await evaluate(`(() => {
    const label=[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('运行平台'))
    if(!label) return false
    const control=label.querySelector('select')
    control.value='ubuntu'
    control.dispatchEvent(new Event('change',{bubbles:true}))
    return true
  })()`)
  assert.ok(selectedPlatform,'平台选择器不存在')
  assert.ok(await retry(() => evaluate("document.body.innerText.includes('NVIDIA 显存') && document.body.innerText.includes('使用单张 NVIDIA 显卡的显存预算')"),'切换到 Ubuntu 的显存输入'))
  await evaluate(`(() => {
    const label=[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('NVIDIA 显存'))
    const control=label.querySelector('select')
    control.value='4'
    control.dispatchEvent(new Event('change',{bubbles:true}))
  })()`)
  const lowVramDebug = await evaluate("JSON.stringify({platform:[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('运行平台'))?.querySelector('select')?.value,vram:[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('NVIDIA 显存'))?.querySelector('select')?.value,best:document.querySelector('.recommend-highlight h4')?.textContent,insufficient:document.querySelector('.unavailable-models')?.textContent?.slice(0,200),verdict:document.querySelector('.verdict')?.textContent})")
  console.log('[DEBUG] 4GB 显存渲染状态：'+lowVramDebug)
  assert.ok(await retry(() => evaluate("!!document.querySelector('.recommend-highlight h4') && document.querySelector('.unavailable-models')?.textContent.includes('7B')"), '4GB 显存应出现分档推荐且将 7B 标为容量不足'))
  console.log('[PASS] Mac → Ubuntu → 4GB 显存，推荐结果按选项重新计算')
  // 2026 跨厂商推荐：默认 Ubuntu 4GB 不应误推荐 Qwen3.8；随后切换 Mac 32GB。
  assert.ok(await retry(() => evaluate("document.querySelector('.multi-vendor-recommendations .unavailable-models')?.textContent.includes('Qwen3.8 27B')"),'4GB NVIDIA 显存应标记 Qwen3.8 为容量不足'))
  await evaluate("(() => {const p=[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('运行平台')).querySelector('select');p.value='mac';p.dispatchEvent(new Event('change',{bubbles:true}))})()")
  assert.ok(await retry(() => evaluate("!![...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('统一内存'))?.querySelector('select')"),'Mac 统一内存选择器未出现'))
  await evaluate("(() => {const r=[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('统一内存')).querySelector('select');r.value='32';r.dispatchEvent(new Event('change',{bubbles:true}))})()")
  assert.ok(await retry(() => evaluate("document.body.innerText.includes('不同厂商的本地模型推荐') && document.body.innerText.includes('Qwen3.8 27B')"),'Mac 32GB 跨厂商推荐及 Qwen3.8 未显示'))
  console.log('[PASS] 跨厂商列表包含 Qwen3.8-27B')
  await evaluate("(() => { const x=[...document.querySelectorAll('.multi-vendor-recommendations label')].find(x=>x.textContent.includes('模型厂商')).querySelector('select');x.value='Google';x.dispatchEvent(new Event('change',{bubbles:true})) })()")
  assert.ok(await retry(() => evaluate("document.querySelector('.catalog-cards')?.textContent.includes('Gemma 4') && !document.querySelector('.catalog-cards')?.textContent.includes('Qwen3.8')"),'跨厂商选择后列表未变化'))
  console.log('[PASS] 选择 Google 后只显示 Gemma 模型')
  await evaluate("(() => { const x=[...document.querySelectorAll('.multi-vendor-recommendations label')].find(x=>x.textContent.includes('模型厂商')).querySelector('select');x.value='all';x.dispatchEvent(new Event('change',{bubbles:true})) })()")
  // 每个内存档位必须变化推荐型号，而不只是改变剩余数字。
  await evaluate("(() => { const p=[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('运行平台')).querySelector('select'); p.value='mac';p.dispatchEvent(new Event('change',{bubbles:true})); })()")
  for (const [ram, expected] of [[8,'3B'],[16,'7B'],[32,'14B'],[64,'32B']]) {
    const selectRam = "(() => { const el=[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('统一内存')).querySelector('select'); el.value=" + JSON.stringify(String(ram)) + "; el.dispatchEvent(new Event('change',{bubbles:true})); return el.value; })()"
    assert.equal(await evaluate(selectRam),String(ram),'浏览器下拉框没有切换至目标档位')
    await sleep(250)
    const state = await evaluate("JSON.stringify({ram:[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('统一内存'))?.querySelector('select')?.value,best:document.querySelector('.recommend-highlight h4')?.textContent,priority:document.querySelector('.rank-group')?.textContent?.slice(0,90)})")
    console.log('[DEBUG] Mac '+ram+'GB: '+state)
    assert.ok(await retry(() => evaluate("document.querySelector('.recommend-highlight h4')?.textContent.includes("+JSON.stringify(expected)+")"), 'Mac '+ram+'GB 应推荐 Qwen '+expected))
    console.log('[PASS] Mac '+ram+'GB 容量分档自动推荐 Qwen '+expected)
  }
  assert.ok(await evaluate("document.querySelector('.rank-group')?.textContent.includes('优先推荐')"),'容量分档推荐缺失')
  // Video task must display actual LTX/Wan candidates, not a generic ComfyUI-only route.
  await evaluate(`(() => {
    const platform=[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('运行平台')).querySelector('select')
    platform.value='mac'
    platform.dispatchEvent(new Event('change',{bubbles:true}))
    const task=[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('模型任务')).querySelector('select')
    task.value='video'
    task.dispatchEvent(new Event('change',{bubbles:true}))
  })()`)
  assert.ok(await retry(() => evaluate("!!document.querySelector('.video-models') && document.body.innerText.includes('LTX-2.5') && document.body.innerText.includes('Wan2.2 TI2V-5B')"), 'Mac 32GB 的 LTX/Wan 视频模型推荐'))
  assert.ok(await evaluate("document.querySelectorAll('.video-model-card').length>=2"),'视频推荐候选数量不足')
  console.log('[PASS] Mac 32GB 展示 LTX-2.5 和 Wan2.2 原生 MLX 候选')

  await evaluate(`(() => {
    const memory=[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('统一内存')).querySelector('select')
    memory.value='16'
    memory.dispatchEvent(new Event('change',{bubbles:true}))
  })()`)
  assert.ok(await retry(() => evaluate("document.querySelectorAll('.video-model-card').length===1 && document.body.innerText.includes('LTX-2.3') && document.querySelector('.unavailable-models')?.textContent.includes('Wan2.2')"),'Mac 16GB 应仅推荐 LTX2.3'))
  console.log('[PASS] Mac 16GB 不误推荐 LTX2.5/Wan2.2')

  await navigate('/mac/recommend/')
  assert.ok(await retry(() => evaluate("!!document.querySelector('.calculator .multi-vendor-recommendations .catalog-card') && document.body.innerText.includes('芯片系列')"),'Mac 专用计算器'))
  console.log('[PASS] Mac 专用推荐页面显示')
  await navigate('/guide/deploy')
  assert.ok(await retry(() => evaluate("!!document.querySelector('.download-planner select')"),'下载路线选择器加载'))
  assert.ok(await evaluate("document.body.innerText.includes('不自动检测你的电脑')"),'必须明确说明用户自行选择硬件')
  await evaluate("(() => {const x=[...document.querySelectorAll('.download-planner label')].find(x=>x.textContent.includes('你的系统')).querySelector('select');x.value='mac';x.dispatchEvent(new Event('change',{bubbles:true}))})()")
  assert.ok(await retry(() => evaluate("!![...document.querySelectorAll('.download-planner label')].find(x=>x.textContent.includes('系统/统一内存'))"),'Mac 统一内存筛选'))
  await evaluate("(() => {const x=[...document.querySelectorAll('.download-planner label')].find(x=>x.textContent.includes('系统/统一内存')).querySelector('select');x.value='64';x.dispatchEvent(new Event('change',{bubbles:true}))})()")
  await evaluate("(() => {const x=[...document.querySelectorAll('.download-planner label')].find(x=>x.textContent.includes('具体模型')).querySelector('select');x.value='q38';x.dispatchEvent(new Event('change',{bubbles:true}))})()")
  assert.ok(await retry(() => evaluate("document.querySelector('.download-instructions pre')?.textContent.includes('ollama pull qwen3.8:27b')"),'根据用户当前模型显示 Ollama 下载指令'))
  console.log('[PASS] 用户选择 Mac/64GB/Qwen3.8 后得到精确 Ollama 下载命令')

  // Deep link must use visitor-selected settings, not the author's M4/32GB sample.
  await navigate('/guide/deploy?platform=mac&memory=64&disk=120&model=ltx25-mlx-q4')
  assert.ok(await retry(() => evaluate("document.querySelector('.selected-summary h3')?.textContent.includes('LTX-2.5') && document.querySelector('.download-instructions pre:last-of-type')?.textContent.includes('hf download dgrauet/ltx-2.5-mlx-q4')"),'URL 中的用户配置未能恢复 LTX 下载命令'))
  console.log('[PASS] 深层链接恢复访客选择的 Mac / 64GB / LTX Q4 和 HF 下载指令')

  await navigate('/guide/deploy?platform=mac&memory=16&disk=120&model=ltx25-mlx-q4')
  assert.ok(await retry(() => evaluate("!!document.querySelector('.not-eligible') && !document.querySelector('.download-instructions')"),'低于当前条件时不应直接推荐下载 LTX2.5'))
  console.log('[PASS] Mac / 16GB 的不适用 LTX2.5 路线不展示直接下载命令')

  await navigate('/guide/model-search')
  assert.ok(await retry(() => evaluate("!!document.querySelector('.hub-search form input')"),'官方模型搜索输入框'))
  console.log('[PASS] 实时官方模型搜索入口加载')

  // 模拟真实 Hub 搜索响应，检验从结果到显式确认和下载命令的完整交互。
  await evaluate("(() => {window.fetch = async (url,opts) => {if(String(url).includes('huggingface.co/api/models?')) return {ok:true,json:async()=>[{id:'dgrauet/ltx-2.5-mlx-q4',pipeline_tag:'text-to-video',downloads:100,likes:8}]};throw Error('unexpected network call: '+url)}})()")
  await evaluate("(() => {const x=document.querySelector('.hub-search form input');x.value='LTX-2.5';x.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.hub-search form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))})()")
  assert.ok(await retry(() => evaluate("document.querySelector('.hub-search .result')?.textContent.includes('dgrauet/ltx-2.5-mlx-q4')"),'模型搜索结果没有显示仓库 ID'))
  await evaluate("document.querySelector('.hub-search .result-actions button').click()")
  assert.ok(await retry(() => evaluate("!!document.querySelector('.hub-search .follow-on') && !document.querySelector('.hub-search .download-help')"),'未确认仓库就不应直接给下载命令'))
  await evaluate("(() => {const c=document.querySelector('.hub-search .confirm input');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))})()")
  assert.ok(await retry(() => evaluate("document.querySelector('.hub-search .download-help pre')?.textContent.includes('hf download dgrauet/ltx-2.5-mlx-q4')"),'用户确认仓库后应显示 Mac 真实下载示例'))
  console.log('[PASS] 模型搜索 → 查看仓库 → 用户确认 → 生成下载命令')


  // Mac portal: real device-first interaction, and each task must have an isolated route.
  await navigate('/mac/')
  assert.ok(await retry(() => evaluate("!!document.querySelector('.mac-path-advisor .goal-grid') && document.querySelectorAll('.mac-path-advisor .goal-card').length===4"),'Mac 新入口四种模型类型渲染失败'))
  assert.ok(await evaluate("!!document.querySelector('.mac-path-advisor .empty-state') && !document.querySelector('.mac-path-advisor .advice-panel')"),'未填写硬件时不能冒充已识别配置')
  await evaluate("(() => { const s=document.querySelectorAll('.mac-path-advisor .hardware-grid select');for(const [i,v] of ['M4','16','30'].entries()){s[i].value=v;s[i].dispatchEvent(new Event('change',{bubbles:true}))} })()")
  await evaluate("document.querySelector('.mac-path-advisor .goal-card:nth-child(3)').click()")
  assert.ok(await retry(() => evaluate("document.querySelector('.mac-path-advisor .advice-panel')?.textContent.includes('LTX-2.3') && document.querySelector('.mac-path-advisor .advice-panel')?.textContent.includes('统一内存')"),'Mac 16GB 视频路线未根据配置更新'))
  assert.ok(await evaluate("document.querySelector('.mac-path-advisor .mini-list')?.textContent.includes('暂不推荐下载')"),'16GB 应明确标记大型视频模型不适用')
  const beginnerVideo=await evaluate("JSON.stringify([...document.querySelectorAll('.mac-path-advisor .mini-item')].map(x=>({name:x.querySelector('strong')?.innerText,href:x.querySelector('a')?.getAttribute('href')||null})))")
  assert.ok(beginnerVideo.includes('ltx23'),'16GB 必须提供 LTX2.3 的独立下载路线')
  console.log('[PASS] Mac 16GB/30GB 视频只推荐适合进一步尝试的 LTX-2.3 专项教程')
  await evaluate("(() => {const s=document.querySelectorAll('.mac-path-advisor .hardware-grid select');s[1].value='64';s[1].dispatchEvent(new Event('change',{bubbles:true}));s[2].value='120';s[2].dispatchEvent(new Event('change',{bubbles:true}))})()")
  assert.ok(await retry(() => evaluate("document.querySelector('.mac-path-advisor .mini-list')?.textContent.includes('LTX-2.5') && document.querySelector('.mac-path-advisor .mini-list')?.textContent.includes('Wan2.2')"),'Mac 64GB 120GB 应展示 LTX/Wan 两条独立路线'))
  console.log('[PASS] Mac 64GB/120GB 视频重新计算并出现 LTX 和 Wan 不同路线')
  await evaluate("document.querySelector('.mac-path-advisor .goal-card:nth-child(1)').click()")
  assert.ok(await retry(() => evaluate("document.querySelector('.mac-path-advisor .advice-panel')?.textContent.includes('Ollama') || document.querySelector('.mac-path-advisor .mini-list')?.textContent.includes('Qwen')"),'切换语言模型后必须显示语言类候选'))
  await evaluate("document.querySelector('.mac-path-advisor .goal-card:nth-child(2)').click()")
  assert.ok(await retry(() => evaluate("document.querySelector('.mac-path-advisor .advice-panel')?.textContent.includes('ComfyUI Desktop')"),'图像路线必须独立于视频'))
  await evaluate("document.querySelector('.mac-path-advisor .goal-card:nth-child(4)').click()")
  assert.ok(await retry(() => evaluate("document.querySelector('.mac-path-advisor .advice-panel')?.textContent.includes('whisper.cpp')"),'语音路线必须独立'))
  console.log('[PASS] 语言/图像/视频/语音四种目标互相独立切换')
  for(const route of ['/mac/chat','/mac/image','/mac/video','/mac/audio','/mac/models/ltx23']){
    await navigate(route)
    assert.ok(await retry(() => evaluate("!!document.querySelector('main h1')"),'专属文档 '+route))
  }
  console.log('[PASS] 五篇 Mac 独立教程可直接访问')

  // Linux and Windows share the same information architecture as Mac:
  // choose hardware → model type → task-specific guide.
  for (const platform of ['ubuntu','windows']){
    await navigate('/'+platform+'/')
    assert.ok(await retry(() => evaluate("!!document.querySelector('.nvidia-goal-advisor .purpose-grid') && document.querySelectorAll('.nvidia-goal-advisor .purpose-card').length===4"), platform+' 四大模型类型入口缺失'))
    assert.ok(await evaluate("!!document.querySelector('.nvidia-goal-advisor .empty')"),platform+' 尚未填写硬件不应显示推荐')
    await evaluate("(() => {const ss=document.querySelectorAll('.nvidia-goal-advisor .config-grid select');for(const [i,v] of ['32','12','80'].entries()){ss[i].value=v;ss[i].dispatchEvent(new Event('change',{bubbles:true}))}})()")
    await evaluate("document.querySelector('.nvidia-goal-advisor .purpose-card:nth-child(3)').click()")
    assert.ok(await retry(() => evaluate("document.querySelector('.nvidia-goal-advisor .output')?.textContent.includes('暂不建议按此路线下载')"),platform+' 12GB VRAM 应阻止直接推荐大型视频模型'))
    await evaluate("(() => {const s=document.querySelectorAll('.nvidia-goal-advisor .config-grid select');s[1].value='24';s[1].dispatchEvent(new Event('change',{bubbles:true}));s[2].value='120';s[2].dispatchEvent(new Event('change',{bubbles:true}))})()")
    assert.ok(await retry(() => evaluate("document.querySelector('.nvidia-goal-advisor .candidate-list')?.textContent.includes('LTX-2.5')"), platform+' 24GB VRAM/120GB 应重新出现视频候选'))
    await evaluate("document.querySelector('.nvidia-goal-advisor .purpose-card:nth-child(1)').click()")
    assert.ok(await retry(() => evaluate("document.querySelector('.nvidia-goal-advisor .output')?.textContent.includes('语言模型')"),platform+' 语言路线未显示'))
    await evaluate("document.querySelector('.nvidia-goal-advisor .purpose-card:nth-child(2)').click()")
    assert.ok(await retry(() => evaluate("document.querySelector('.nvidia-goal-advisor .output')?.textContent.includes('ComfyUI')"),platform+' 图像路线未显示'))
    await evaluate("document.querySelector('.nvidia-goal-advisor .purpose-card:nth-child(4)').click()")
    assert.ok(await retry(() => evaluate("document.querySelector('.nvidia-goal-advisor .output')?.textContent.includes('whisper.cpp')"),platform+' 语音路线未显示'))
    console.log('[PASS] '+platform+' 硬件筛选与四条独立模型路线切换')
    for (const type of ['chat','image','video','audio']){
      await navigate('/'+platform+'/'+type)
      assert.ok(await retry(() => evaluate("!!document.querySelector('main h1')"),platform+'/'+type+' 页面加载'))
    }
    console.log('[PASS] '+platform+' 四篇独立新手教程可访问')
  }

  await navigate('/guide/start')
  assert.ok(await retry(() => evaluate("!!document.querySelector('.deployment-picker .selectors')"),'部署路线选择器'))
  console.log('[PASS] 部署路线向导显示')

  assert.ok(await evaluate("document.querySelectorAll('.deployment-picker .stage a').length===0 && document.querySelectorAll('.deployment-picker a.go').length===1"),'新手主流程不能再是六个步骤六次跳转')
  await evaluate("(() => {const s=document.querySelectorAll('.deployment-picker .selectors select');s[0].value='ubuntu';s[0].dispatchEvent(new Event('change',{bubbles:true}));s[1].value='image';s[1].dispatchEvent(new Event('change',{bubbles:true}))})()")
  assert.ok(await retry(() => evaluate("document.querySelector('.deployment-picker a.go')?.getAttribute('href').includes('/ubuntu/?task=image')")),'开始部署只应直接引导到指定系统和目标')
  console.log('[PASS] 从零开始入口不再拆成六个可点击步骤')

  await navigate('/mac/?task=chat')
  assert.ok(await retry(()=>evaluate("document.querySelector('.mac-path-advisor .advice-panel')===null && !!document.querySelector('.mac-path-advisor .goal-card[aria-pressed=true]')")),'跨页任务类型未预选')
  await evaluate("(() => {const s=document.querySelectorAll('.mac-path-advisor .hardware-grid select');for(const [i,v] of ['M4','64','120'].entries()){s[i].value=v;s[i].dispatchEvent(new Event('change',{bubbles:true}))}})()")
  assert.ok(await retry(()=>evaluate("document.querySelector('.mac-path-advisor .mini-item a')?.getAttribute('href').includes('/mac/chat?')")),'Mac 语言模型不得再绕去通用下载页')
  const selectedMac=await evaluate("document.querySelector('.mac-path-advisor .mini-item a')?.getAttribute('href')")
  assert.ok(selectedMac.includes('model='),'模型选择必须随路由保留')
  await navigate('/mac/chat?model=q38&chip=M4&memory=64&disk=120')
  assert.ok(await retry(()=>evaluate("document.querySelector('#quick-ollama-model')?.value==='q38' && document.querySelector('.one-page-ollama')?.textContent.includes('ollama pull qwen3.8:27b')")),'进入教程后没有恢复选择的 Qwen3.8 和下载命令')
  assert.ok(await evaluate("document.querySelector('.deployment-selection')?.textContent.includes('64 GB')"),'硬件参数必须跟随到完整教程')
  console.log('[PASS] Mac 推荐 → 同一篇 Ollama 教程，模型和硬件配置不丢失')

  for(const platform of ['ubuntu','windows']){
    await navigate('/'+platform+'/chat?model=q7&memory=32&vram=12&disk=80')
    assert.ok(await retry(()=>evaluate("document.querySelector('#quick-ollama-model')?.value==='q7' && document.querySelector('.one-page-ollama')?.textContent.includes('ollama pull qwen2.5:7b')")), platform+' 具体模型标签未带入完整教程')
    assert.ok(await evaluate("document.querySelector('.deployment-selection')?.textContent.includes('12 GB')"),platform+' 显存信息丢失')
  }
  console.log('[PASS] Linux 和 Windows 一次选择的参数可直接带到下载与验证步骤')

} finally {
  if (ws && ws.readyState === WebSocket.OPEN) ws.close()
  if (chrome) chrome.kill('SIGTERM')
  if (preview) preview.kill('SIGTERM')
  // Chrome may still be flushing its profile after SIGTERM. Never fail a passed UI test just because cleanup races.
  await sleep(600)
  try {
    rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:200})
  } catch (error) {
    console.warn('[WARN] 临时 Chrome 配置清理失败：', error.message)
  }
}
