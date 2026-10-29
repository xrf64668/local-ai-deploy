import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ModelAdvisor from './components/ModelAdvisor.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ModelAdvisor', ModelAdvisor)
  }
} satisfies Theme
