import Vue from 'vue'
import Vuetify from 'vuetify/lib'
//import 'vuetify/src/stylus/app.styl'
import zhHans from 'vuetify/src/locale/zh-Hans'
import meta from '../common/config'


Vue.use(Vuetify)

export default new Vuetify({
  theme: {
    themes: {
      light: meta.theme,
      dark: meta.theme
    },
    options: {
      customProperties: true
    }
  },
  customProperties: true,
  lang: {
    locales: { zhHans },
    current: 'zh-Hans'
  },
  icons: {
    values: {
      brand: new Proxy({} as any, {
        get (target, key) {
          if (Reflect.has(target, key)) {
            return Reflect.get(target, key)
          }
          if (typeof key === 'string') {
            return `fab fa-${key}`
          }
        }
      })
    },
    iconfont: 'md'
  }
})
