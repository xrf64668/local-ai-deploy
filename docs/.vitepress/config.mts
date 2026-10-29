import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '本地 AI 模型部署指南',
  description: '大语言模型、视频、图像和语音模型的 Mac、Ubuntu、Windows 本地部署实践',
  lang: 'zh-CN',
  base: '/local-ai-deploy/',
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '快速入门', link: '/guide/what-is-local-ai' },
      { text: '硬件选模型', link: '/recommend/' },
      { text: 'Mac', link: '/mac/' },
      { text: 'Ubuntu', link: '/ubuntu/' },
      { text: 'Windows', link: '/windows/' }
    ],
    sidebar: [
      { text: '入门', items: [
        { text: '什么是本地 AI 部署', link: '/guide/what-is-local-ai' },
        { text: '硬件、显存与统一内存', link: '/guide/hardware' },
        { text: '如何选择工具', link: '/guide/choose-tool' }
      ] },
      { text: '智能选型', items: [
        { text: '按硬件配置推荐模型', link: '/recommend/' }
      ] },
      { text: '平台指南', items: [
        { text: 'Mac', link: '/mac/' },
        { text: 'Ubuntu GPU', link: '/ubuntu/' },
        { text: 'Windows NVIDIA', link: '/windows/' }
      ] }
    ],
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/xrf64668/local-ai-deploy' }
    ],
    outline: { level: [2, 3], label: '页面导航' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新于' }
  }
})
