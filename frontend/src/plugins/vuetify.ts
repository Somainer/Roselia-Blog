import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { fa } from 'vuetify/iconsets/fa'
import { zhHans, en } from 'vuetify/locale'
import meta from '../common/config'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: meta.theme
      },
      dark: {
        dark: true,
        colors: meta.theme
      }
    }
  },
  locale: {
    locale: 'zhHans',
    fallback: 'en',
    messages: { zhHans, en }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi, fa }
  }
})
