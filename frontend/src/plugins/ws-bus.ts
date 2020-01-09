import io from 'socket.io-client'
import utils from '@/common/utils'
import { userInfoManager, IRoseliaUserData } from '@/common/UserInfoManager'


class RoseliaWSBus {
    private readonly connection: typeof io.Socket;
    private static storedHandlers: [string, any][] = []
    constructor(token: string, restorePrevious: boolean = true) {
        const baseUri = utils.apiFor('socket')
        this.connection = io(`${baseUri}?token=${token}`, {
            path: (new URL(baseUri, location.href)).pathname
        })
        if (restorePrevious) {
            RoseliaWSBus.storedHandlers.forEach(([e, h]) => this.addListenerUnchecked(e, h))
        } else {
            RoseliaWSBus.storedHandlers = []
        }
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
}

const bus: { globalBus?: RoseliaWSBus, restorePrevious: boolean } = {
    globalBus: undefined,
    restorePrevious: true
}

const handleBus = (data?: IRoseliaUserData) => {
    if(data) {
        bus.globalBus = new RoseliaWSBus(data.token, bus.restorePrevious)
    } else {
        bus.globalBus?.dispose()
        bus.globalBus = undefined
    }
}

handleBus(userInfoManager.getPayload())
userInfoManager.addChangeListener(handleBus)

export default bus
