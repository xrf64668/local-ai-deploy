import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = 'docs/.vitepress/dist'
const cases = [
  {route:'recommend/',markers:['运行平台','统一内存','模型权重','当前硬件的模型推荐结果']},
  {route:'mac/recommend/',markers:['芯片系列','统一内存','模型权重','当前硬件的模型推荐结果']},
  {route:'ubuntu/',markers:['确认自己的电脑配置','语言模型','视频模型']},
  {route:'windows/',markers:['确认自己的电脑配置','图像模型','语音识别']},
  {route:'ubuntu/chat',markers:['Ubuntu 语言模型','安装 Ollama','第一次本地聊天']},
  {route:'ubuntu/image',markers:['Ubuntu 图像模型','ComfyUI','第一次生成']},
  {route:'ubuntu/video',markers:['Ubuntu 视频模型','LTX','Wan']},
  {route:'ubuntu/audio',markers:['Ubuntu 语音识别','whisper.cpp','转写自己的音频']},
  {route:'windows/chat',markers:['Windows 语言模型','下载第一个模型','开始聊天']},
  {route:'windows/image',markers:['Windows 图像模型','ComfyUI','第一张图']},
  {route:'windows/video',markers:['Windows 视频模型','LTX','Wan']},
  {route:'windows/audio',markers:['Windows 语音识别','whisper.cpp','第一次识别']},
  {route:'mac/',markers:['先选择你使用的 Mac','语言大模型','视频生成']},
  {route:'mac/chat',markers:['Mac 语言大模型','从官方模型库下载','运行并验证']},
  {route:'mac/image',markers:['Mac 图像模型','ComfyUI Desktop','生成第一张']},
  {route:'mac/video',markers:['Mac 视频模型','LTX-2.3','Wan2.2']},
  {route:'mac/audio',markers:['Mac 语音模型','whisper.cpp','转写自己的录音']},
  {route:'mac/models/ltx23',markers:['Mac LTX-2.3','ltx-2-mlx','生成第一个短视频']},
  {route:'guide/start',markers:['我的电脑','想运行什么','确认电脑配置']},
  {route:'guide/deploy',markers:['用你的硬件配置生成下载命令','你的系统','请选择容量']},
  {route:'guide/model-download',markers:['新手下载模型','第一步','第四步']},
  {route:'guide/model-search',markers:['第一次找模型','搜索官方模型']}
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
