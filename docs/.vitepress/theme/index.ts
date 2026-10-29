import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ModelAdvisor from './components/ModelAdvisor.vue'
import MacModelAdvisor from './components/MacModelAdvisor.vue'
import DeploymentPathPicker from './components/DeploymentPathPicker.vue'
import ModelDownloadPlanner from './components/ModelDownloadPlanner.vue'
import HubModelSearch from './components/HubModelSearch.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ModelAdvisor', ModelAdvisor)
    app.component('MacModelAdvisor', MacModelAdvisor)
    app.component('DeploymentPathPicker', DeploymentPathPicker)
    app.component('ModelDownloadPlanner', ModelDownloadPlanner)
    app.component('HubModelSearch', HubModelSearch)
  }
} satisfies Theme
