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

const iconSvg = join(root, 'favicon.svg')
const logoSvg = join(root, 'logo.svg')
const favicon = join(root, 'favicon.ico')
for(const path of [iconSvg,logoSvg,favicon]) assert.ok(existsSync(path), '站点缺少图标文件：'+path)
const ico = readFileSync(favicon)
assert.ok(ico.length>500, 'favicon.ico 文件过小')
assert.deepEqual([...ico.subarray(0,4)],[0,0,1,0], 'favicon.ico 文件头错误')
assert.ok(readFileSync(iconSvg,'utf8').includes('<svg '),'favicon.svg 不是有效的 SVG 标记')
const homepage = readFileSync(join(root,'index.html'),'utf8')
for(const name of ['本地 AI 实战指南','favicon.svg','favicon.ico']){
  assert.ok(homepage.includes(name),'首页未包含品牌名称或图标引用：'+name)
}
console.log('[PASS] 品牌名称与 SVG/ICO 浏览器图标已经进入发布结果')
