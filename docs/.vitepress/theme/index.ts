import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ModelAdvisor from './components/ModelAdvisor.vue'
import MacModelAdvisor from './components/MacModelAdvisor.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ModelAdvisor', ModelAdvisor)
    app.component('MacModelAdvisor', MacModelAdvisor)
  }
} satisfies Theme
