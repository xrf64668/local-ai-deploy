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
  assert.ok(await retry(() => evaluate("document.querySelector('.verdict')?.textContent.includes('超出当前全 GPU 预算')"), '4GB 显存应显示容量不足'))
  console.log('[PASS] Mac → Ubuntu → 4GB 显存，推荐结果按选项重新计算')
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
