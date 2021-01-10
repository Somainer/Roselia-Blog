import io from 'socket.io-client'
import utils from '@/common/utils'
import { userInfoManager, IRoseliaUserData } from '@/common/UserInfoManager'


class RoseliaWSBus {
    private readonly connection: typeof io.Socket;
    private static storedHandlers: [string, any][] = []
    constructor(token: string, restorePrevious: boolean = true) {
        const baseUri = utils.apiFor('socket')
        const namespace = new URL(baseUri, location.href)
        namespace.pathname = '/api/socket'
        // namespace.searchParams.set('token', token)
        const connectionUrl = new URL(baseUri, location.href)
        this.connection = io(namespace.href, {
            path: connectionUrl.pathname,
            host: connectionUrl.host,
            reconnection: true,
            reconnectionAttempts: 5,
            transportOptions: {
                polling: {
                    extraHeaders: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            }
        })
        if (restorePrevious) {
            RoseliaWSBus.storedHandlers.forEach(([e, h]) => this.addListenerUnchecked(e, h))
        } else {
            RoseliaWSBus.storedHandlers = []
        }

        this.connection.once('reject', () => { 
            this.dispose()
        })
    }

    private addListenerUnchecked(eventType: string, handler: (...args: any[]) => void) {
        this.connection.on(eventType, handler)
    }

    public addEventListener(eventType: string, handler: (...args: any[]) => void, persistent: Boolean = false) {
        this.addListenerUnchecked(eventType, handler)
        persistent && RoseliaWSBus.storedHandlers.push([eventType, handler])

        return () => {
            this.removeEventListener(eventType, handler)
        }
    }

    public addEventListenerOnce(eventType: string, handler: (...args: any[]) => void) {
        this.connection.once(eventType, handler)
    }

    public removeEventListener(eventType: string, handler?: (...args: any[]) => void) {
        this.connection.off(eventType, handler)
        RoseliaWSBus.storedHandlers = RoseliaWSBus.storedHandlers.filter(([e, h]) => e !== eventType && (typeof handler === 'undefined' || h !== handler))
    }

    public emitEvent(event: string, ...payload: any[]) {
        this.connection.emit(event, ...payload)
    }
    public dispose() {
        this.connection.close()
    }
    public isConnected(): boolean {
        return this.connection.connected;
    }
}

type RoseliaWSSubscriber = (bus: RoseliaWSBus) => void
class GlobalBusManager {
    public globalBus?: RoseliaWSBus
    restorePrevious: boolean = true
    private subscriber: RoseliaWSSubscriber[] = [];

    public subscribe(busSubscriber: RoseliaWSSubscriber) {
        if (this.globalBus) busSubscriber(this.globalBus)
        else {
            this.subscriber.push(busSubscriber)
        }
    }

    public dispose() {
        this.globalBus?.dispose()
        this.globalBus = undefined;
    }

    public handleInfoChange(data?: IRoseliaUserData) {
        if (data) {
            this.globalBus = new RoseliaWSBus(data.token, this.restorePrevious)
            this.subscriber.forEach(subscribe => subscribe(this.globalBus!))
            this.subscriber = [];
        } else {
            this.dispose()
        }
    }

    public tryConnect() {
        if (this.globalBus?.isConnected) return;
        this.handleInfoChange(userInfoManager.getPayload())
    }
}

const bus = new GlobalBusManager();

bus.tryConnect()
userInfoManager.addChangeListener(info => bus.handleInfoChange(info))

export default bus
