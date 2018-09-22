// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import Vuetify from 'vuetify'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import 'vuetify/dist/vuetify.min.css'
import meta from './common/config'
import toast from './components/toast'
import toolbar from './components/BlogToolbar'
import footer from './components/BlogFooter'
import VueProgressBar from 'vue-progressbar'
import fabTop from './components/GotopButton'


Vue.use(Vuetify, {
  theme: meta.theme
})

Vue.use(VueProgressBar, {
  color: meta.theme.secondary,
  failedColor: meta.theme.error,
  thickness: '4px'
})

Vue.component('toast', toast)
Vue.component('nav-bar', toolbar)
Vue.component('blog-footer', footer)
Vue.component('go-top-btn', fabTop)

Vue.directive('focus', {
  update: function (el, {value}) {
    if (value) {
      el.focus()
    }
  }
})

Vue.config.productionTip = false

/* eslint-disable no-new */
export default new Vue({
  el: '#app',
  router,
  // render: h => h(App)
  components: {App},
  template: '<App/>'
})