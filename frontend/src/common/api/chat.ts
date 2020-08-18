import bus from '@/plugins/ws-bus'
import { IRoseliaUserMeta } from '@/common/post-information'

export interface IUserChatMessage {
    to: string
    content: string
    createdAt?: Date
}

export interface IInComechatMessage extends IUserChatMessage {
    from: string
    sender?: IRoseliaUserMeta
}

export const subscribeOnMessage = (handler: (message: IInComechatMessage) => void): IDisposable => {
    const dispose = bus.globalBus?.addEventListener('inbox_message', handler, true)

    return {
        dispose() {
            dispose?.()
        }
    }
}

export const sendMessage = (message: IUserChatMessage, sender?: IRoseliaUserMeta) => {
    bus.globalBus?.emitEvent('send_message', {
        ...message,
        sender
    })
}

export const getOnlineStatus = (username: string) => new Promise<boolean>((resolve, reject) => {
    bus.globalBus?.addEventListenerOnce('user_online_status', status => {
        if (status.username === username) resolve(status.status);
    })
    setTimeout(() => reject(new Error('Timeout')), 3000);
    bus.globalBus?.emitEvent('query_online_status', { username })
})