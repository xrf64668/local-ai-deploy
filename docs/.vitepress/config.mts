import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '本地 AI 模型部署指南',
  description: 'Mac、Ubuntu、Windows 上从硬件检查、模型部署到 ComfyUI 和 API 接入的中文实战教程',
  lang: 'zh-CN',
  base: '/local-ai-deploy/',
  lastUpdated: true,
  cleanUrls: false,
  themeConfig: {
    logo: undefined,
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
        { text: 'Mac 本地 AI 入门', items: [
          { text: '总览：从哪里开始', link: '/mac/' },
          { text: '部署路线与目录约定', link: '/mac/roadmap' },
          { text: 'Mac 专用模型推荐器', link: '/mac/recommend/' }
        ] },
        { text: '01–07 部署实践', collapsed: false, items: [
          { text: '01 · 硬件与系统检查', link: '/mac/01-preflight' },
          { text: '02 · 独立环境与缓存', link: '/mac/02-environment' },
          { text: '03 · 选择推理运行时', link: '/mac/03-runtime' },
          { text: '04 · 下载模型与锁定版本', link: '/mac/04-models' },
          { text: '05 · 真实生成验证', link: '/mac/05-verify' },
          { text: '06 · 本地推理与资源控制', link: '/mac/06-inference' },
          { text: '07 · HTTP API 接入', link: '/mac/07-api' }
        ] },
        { text: '模型专项', items: [
          { text: 'Ollama：最简单的本地 API', link: '/mac/models/ollama' },
          { text: 'LTX-2.5 · MLX Q4', link: '/mac/models/ltx25' },
          { text: 'Wan2.2 · 实验性 MLX', link: '/mac/models/wan22' }
        ] },
        { text: '继续学习', items: [
          { text: 'Mac ComfyUI 安装', link: '/comfyui/mac' },
          { text: 'Mac 故障排查', link: '/mac/troubleshooting' },
          { text: '按硬件选模型', link: '/recommend/' }
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
          { text: '模型路径与文件说明', link: '/comfyui/models-and-paths' },
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
