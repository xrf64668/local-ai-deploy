import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '本地 AI 实战指南',
  description: '从硬件选型、模型下载到本地推理与 API 接入，适用于 Mac、Ubuntu 和 Windows 的中文实战教程',
  lang: 'zh-CN',
  base: '/local-ai-deploy/',
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/local-ai-deploy/favicon.svg' }],
    ['link', { rel: 'alternate icon', type: 'image/x-icon', href: '/local-ai-deploy/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#182C62' }],
    ['meta', { property: 'og:site_name', content: '本地 AI 实战指南' }],
    ['meta', { property: 'og:title', content: '本地 AI 实战指南 · 从选模型到真实运行' }],
    ['meta', { property: 'og:description', content: '从硬件选型、模型下载到本地推理与 API 接入，适用于 Mac、Ubuntu 和 Windows 的中文实战教程' }]
  ],
  cleanUrls: false,
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '首页', link: '/' },
      { text: '开始部署', link: '/guide/start' },
      { text: 'Mac 实战', link: '/mac/' },
      { text: 'ComfyUI', link: '/comfyui/' },
      { text: '容量计算', link: '/recommend/' },
      { text: '其他平台', items: [
        { text: 'Ubuntu NVIDIA', link: '/ubuntu/' },
        { text: 'Windows NVIDIA', link: '/windows/' }
      ] }
    ],
    sidebar: {
      '/mac/': [
        { text: '从这里开始', items: [
          { text: '我的 Mac：选配置和目标', link: '/mac/' },
          { text: '怎么查看硬件配置', link: '/mac/01-preflight' },
          { text: '按统一内存选模型', link: '/mac/recommend/' }
        ] },
        { text: '按模型类型分别部署', items: [
          { text: '语言大模型 · Ollama', link: '/mac/chat' },
          { text: '图像模型 · ComfyUI', link: '/mac/image' },
          { text: '视频模型 · LTX / Wan', link: '/mac/video' },
          { text: '语音识别 · Whisper', link: '/mac/audio' }
        ] },
        { text: '具体模型教程（可选）', collapsed: true, items: [
          { text: 'Qwen / 其他 · Ollama', link: '/mac/models/ollama' },
          { text: 'LTX-2.3 · MLX Q4', link: '/mac/models/ltx23' },
          { text: 'LTX-2.5 · MLX Q4', link: '/mac/models/ltx25' },
          { text: 'Wan2.2 · MLX Q8', link: '/mac/models/wan22' },
          { text: 'LTX HTTP 接入 · 开发者', link: '/mac/models/ltx25-api' }
        ] },
        { text: '深入配置与技术原理（可选）', collapsed: true, items: [
          { text: '部署架构与目录管理', link: '/mac/roadmap' },
          { text: '01 · 硬件检查', link: '/mac/01-preflight' },
          { text: '02 · 独立环境与缓存', link: '/mac/02-environment' },
          { text: '03 · 运行时与框架', link: '/mac/03-runtime' },
          { text: '04 · 模型来源与下载', link: '/mac/04-models' },
          { text: '05 · 真实生成验证', link: '/mac/05-verify' },
          { text: '06 · 内存与资源控制', link: '/mac/06-inference' },
          { text: '07 · HTTP API 接入', link: '/mac/07-api' },
          { text: '排查 Mac 常见问题', link: '/mac/troubleshooting' }
        ] }
      ],
      '/comfyui/': [
        { text: 'ComfyUI 新手专区', items: [
          { text: '认识 ComfyUI', link: '/comfyui/' },
          { text: 'Mac · 桌面版零命令安装', link: '/comfyui/mac' },
          { text: '新手术语词典', link: '/comfyui/glossary' },
          { text: 'Ubuntu · NVIDIA', link: '/comfyui/ubuntu' },
          { text: 'Windows · NVIDIA', link: '/comfyui/windows' }
        ] },
        { text: '第一次完整生成', items: [
          { text: '第一次生成图片', link: '/comfyui/first-workflow' },
          { text: '下载模型与放置目录', link: '/comfyui/models-and-paths' },
          { text: '常见问题与排查', link: '/comfyui/troubleshooting' }
        ] },
        { text: '进阶与自动化', items: [
          { text: 'Mac · 手动安装（进阶）', link: '/comfyui/mac-manual' },
          { text: 'ComfyUI 本地 API', link: '/comfyui/api' }
        ] }
      ],
      '/guide/': [
        { text: '基础知识', items: [
          { text: '部署路线选择', link: '/guide/start' },
          { text: '新手：怎么找模型、怎么下载', link: '/guide/model-download' },
          { text: '搜索模型与生成下载命令', link: '/guide/model-search' },
          { text: '模型库自动发现与实测数据', link: '/contribute/model-lifecycle' },
          { text: '根据自己的设备生成下载指令', link: '/guide/deploy' },
          { text: '什么是本地 AI 部署', link: '/guide/what-is-local-ai' },
          { text: '硬件、显存与统一内存', link: '/guide/hardware' },
          { text: '如何选择工具', link: '/guide/choose-tool' }
        ] },
        { text: '马上实践', items: [
          { text: 'Mac 部署', link: '/mac/' },
          { text: 'ComfyUI 入门', link: '/comfyui/' },
          { text: '硬件推荐器', link: '/recommend/' }
        ] }
      ],
      '/recommend/': [
        { text: '模型选型', items: [
          { text: '交互式容量计算', link: '/recommend/' },
          { text: '按设备生成下载指令', link: '/guide/deploy' },
          { text: '搜索官方模型', link: '/guide/model-search' },
          { text: '模型更新与实测反馈机制', link: '/contribute/model-lifecycle' },
          { text: 'Qwen3.8-27B 部署教程', link: '/guide/qwen38-27b' },
          { text: '公式与假设', link: '/recommend/how-it-works' },
          { text: 'Mac 七阶段实战', link: '/mac/' },
          { text: 'ComfyUI 入口', link: '/comfyui/' }
        ] }
      ],
      '/ubuntu/': [
        { text: 'Ubuntu NVIDIA', items: [
          { text: 'Ubuntu 主页', link: '/ubuntu/' },
          { text: 'Ollama 本地模型', link: '/ubuntu/ollama' },
          { text: 'ComfyUI 安装', link: '/comfyui/ubuntu' },
          { text: '按显存推荐模型', link: '/recommend/' }
        ] }
      ],
      '/windows/': [
        { text: 'Windows NVIDIA', items: [
          { text: 'Windows 主页', link: '/windows/' },
          { text: 'Ollama 本地模型', link: '/windows/ollama' },
          { text: 'ComfyUI 安装', link: '/comfyui/windows' },
          { text: '按显存推荐模型', link: '/recommend/' }
        ] }
      ]
    },
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/xrf64668/local-ai-deploy' }
    ],
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新' },
    editLink: {
      pattern: 'https://github.com/xrf64668/local-ai-deploy/edit/main/docs/:path',
      text: '发现问题？帮助完善本页'
    },
    footer: {
      message: '一步一验收 · 不夸大兼容性 · 以真实输出为准',
      copyright: '内容持续维护 · 模型和框架的具体许可证请查看上游项目'
    }
  }
})
