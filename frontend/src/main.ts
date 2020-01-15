// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import store from './store'
// import 'material-design-icons-iconfont/dist/material-design-icons.css'
// import 'vuetify/dist/vuetify.min.css'
import meta from './common/config'
import toast from './components/toast.vue'
import toolbar from './components/BlogToolbar.vue'
import footer from './components/BlogFooter.vue'
import VueProgressBar from 'vue-progressbar'
import fabTop from './components/GotopButton.vue'
import '@fortawesome/fontawesome-free/css/all.css'
import { ObserveVisibility } from 'vue-observe-visibility'

import '@/plugins/token-auto-refresh'

Vue.prototype.config = meta

// Vue.use(Vuetify, {
//   theme: meta.theme,
//   icons: {
//     brand: new Proxy({}, {
//       get (target, key) {
//         if (Reflect.has(target, key)) {
//           return Reflect.get(target, key)
//         }
//         if (typeof key === 'string') {
//           return `fab fa-${key}`
//         }
//       }
//     })
//   }
// })

Vue.use(VueProgressBar, {
  color: meta.theme.secondary,
  failedColor: meta.theme.error,
  thickness: '4px'
})

Vue.directive('observe-visibility', ObserveVisibility)

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
export default new Vue(<any>{
  router,
  store,
  vuetify,
  // render: h => h(App)
  render: h => h(App)
}).$mount('#black-shout')
