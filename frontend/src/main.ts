import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import meta from './common/config'
import toast from './components/toast.vue'
import toolbar from './components/BlogToolbar.vue'
import footer from './components/BlogFooter.vue'
import fabTop from './components/GotopButton.vue'
import '@fortawesome/fontawesome-free/css/all.css'
import { ObserveVisibility } from 'vue-observe-visibility'

import { ProgressPlugin } from './plugins/progress'
import PageTitle from './plugins/page-title'

import '@/plugins/token-auto-refresh'

const app = createApp(App)

app.config.globalProperties.config = meta

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(ProgressPlugin)
app.use(PageTitle)

app.directive('observe-visibility', ObserveVisibility as any)

app.component('toast', toast)
app.component('nav-bar', toolbar)
app.component('blog-footer', footer)
app.component('go-top-btn', fabTop)

app.directive('focus', {
  updated(el: HTMLElement, { value }) {
    if (value) el.focus()
  }
})

app.mount('#black-shout')

export default app
