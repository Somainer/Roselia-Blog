import { VNode } from 'vue'

export interface INotification {
    time?: number
    message: VNode | string
    color?: string
    id?: number
    show?: boolean
}
