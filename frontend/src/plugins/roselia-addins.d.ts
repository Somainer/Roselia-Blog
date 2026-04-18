import type { INotification } from '@/common/api/notifications'
import type { IProgress } from './progress'

declare module 'vue' {
  interface ComponentCustomProperties {
    $notify(toast: INotification): void
    $Progress: IProgress
    config: typeof import('@/common/config')
  }
}

export {}
