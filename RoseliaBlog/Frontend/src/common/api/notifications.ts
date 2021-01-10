import { VNode } from 'vue'

export interface INotification {
    time?: number
    message: VNode | string
    color?: string
    id?: number
    show?: boolean
}

export const sendBrowserNotification = async (notification: string, options?: NotificationOptions) => {
    if ('Notification' in window) {
        if (Notification.permission !== 'granted') {
            await Notification.requestPermission();
        }
        if (Notification.permission === 'granted') {
            return new Notification(notification, options)
        } else {
            return Promise.reject(new Error('User rejected.'))
        }
    }
    return Promise.reject(new Error('Notification is not supported.'))
}
