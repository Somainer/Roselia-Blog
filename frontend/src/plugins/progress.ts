import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import meta from '../common/config'
import type { App } from 'vue'

NProgress.configure({ showSpinner: false, trickleSpeed: 200, minimum: 0.08 })

if (typeof document !== 'undefined') {
  const styleId = 'roselia-nprogress-theme'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      #nprogress .bar { background: ${meta.theme.secondary}; height: 4px; }
      #nprogress .peg { box-shadow: 0 0 10px ${meta.theme.secondary}, 0 0 5px ${meta.theme.secondary}; }
    `
    document.head.appendChild(style)
  }
}

export interface IProgress {
  start(): void
  finish(): void
  fail(): void
  parseMeta(m: any): void
}

const progress: IProgress = {
  start() { NProgress.start() },
  finish() { NProgress.done() },
  fail() { NProgress.done(true) },
  parseMeta(_m: any) { /* no-op, kept for API compatibility */ }
}

export default progress

export const ProgressPlugin = {
  install(app: App) {
    app.config.globalProperties.$Progress = progress
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $Progress: IProgress
  }
}
