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
  assert.ok(await evaluate("document.body.innerText.includes('模型权重')"),'初始计算结果缺失')
  console.log('[PASS] 浏览器显示 Mac 默认容量计算器')
  const selectedPlatform = await evaluate(`(() => {
    const label=[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('运行平台'))
    if(!label) return false
    const control=label.querySelector('select')
    control.value='ubuntu'
    control.dispatchEvent(new Event('change',{bubbles:true}))
    return true
  })()`)
  assert.ok(selectedPlatform,'平台选择器不存在')
  assert.ok(await retry(() => evaluate("document.body.innerText.includes('NVIDIA 显存') && document.body.innerText.includes('独立 GPU 显存')"),'切换到 Ubuntu 的显存输入'))
  await evaluate(`(() => {
    const label=[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('NVIDIA 显存'))
    const control=label.querySelector('select')
    control.value='4'
    control.dispatchEvent(new Event('change',{bubbles:true}))
  })()`)
  assert.ok(await retry(() => evaluate("document.querySelector('.recommend-highlight h4')?.textContent.includes('1.5B') && document.querySelector('.unavailable-models')?.textContent.includes('7B')"), '4GB 显存应推荐较小模型并将 7B 标记容量不足'))
  console.log('[PASS] Mac → Ubuntu → 4GB 显存，推荐结果按选项重新计算')
  // 每个内存档位必须变化推荐型号，而不只是改变剩余数字。
  await evaluate("(() => { const p=[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('运行平台')).querySelector('select'); p.value='mac';p.dispatchEvent(new Event('change',{bubbles:true})); })()")
  for (const [ram, expected] of [[8,'3B'],[16,'7B'],[32,'14B'],[64,'32B']]) {
    await evaluate("(() => { const ram=[...document.querySelectorAll('.calculator label')].find(x=>x.textContent.includes('统一内存')).querySelector('select'); ram.value=" + JSON.stringify(String(8)) + ";ram.dispatchEvent(new Event('change',{bubbles:true})); })()".replace('"8"',JSON.stringify(String(ram))))
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
  assert.ok(await retry(() => evaluate("!!document.querySelector('.calculator .metrics') && document.body.innerText.includes('芯片系列')"),'Mac 专用计算器'))
  console.log('[PASS] Mac 专用推荐页面显示')
  await navigate('/guide/start')
  assert.ok(await retry(() => evaluate("!!document.querySelector('.deployment-picker .selectors')"),'部署路线选择器'))
  console.log('[PASS] 部署路线向导显示')
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
