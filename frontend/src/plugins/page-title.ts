import type { App, Directive } from 'vue'

const setTitle = (title: string | undefined | null) => {
  if (typeof title === 'string' && title.length > 0) {
    document.title = title
  }
}

export const pageTitleDirective: Directive<HTMLElement, string | undefined | null> = {
  mounted(_el, binding) {
    setTitle(binding.value)
  },
  updated(_el, binding) {
    if (binding.value !== binding.oldValue) {
      setTitle(binding.value)
    }
  }
}

export default {
  install(app: App) {
    app.directive('wechat-title', pageTitleDirective)
    app.directive('page-title', pageTitleDirective)
  }
}
