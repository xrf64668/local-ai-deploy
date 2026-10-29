import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = 'docs/.vitepress/dist'
const cases = [
  {route:'recommend/',markers:['运行平台','统一内存','模型权重','当前硬件的模型推荐结果']},
  {route:'mac/recommend/',markers:['芯片系列','统一内存','模型权重','当前硬件的模型推荐结果']},
  {route:'guide/start',markers:['我的电脑','想运行什么','确认电脑配置']}
]

for (const {route,markers} of cases) {
  const candidates = route.endsWith('/')
    ? [join(root,route,'index.html'),join(root,route.slice(0,-1)+'.html')]
    : [join(root,route+'.html'),join(root,route,'index.html')]
  const path = candidates.find(existsSync)
  assert.ok(path, '构建结果缺少页面：' + route)
  const html = readFileSync(path, 'utf8')
  const missing = markers.filter(marker => !html.includes(marker))
  assert.deepEqual(missing, [], route+' 页面缺少预期的服务端渲染内容：'+missing.join(', '))
  console.log('[PASS] '+route+' 静态 HTML 包含模型表单/部署选择器')
}
