export class RoseliaStorage<T extends object = any> {
    private readonly key: string
    private readonly storage: Storage
    private changeListeners: ((s: T) => void)[] = []
    private readonly removeHandler: () => void

    constructor(key: string, storage = localStorage) {
        this.key = key
        this.storage = storage
        this.removeHandler = this.addStorageEventListener(() => this.onStorageChanged())
    }

    private onStorageChanged() {
        const payload = this.payload
        this.changeListeners.forEach(l => l(payload))
    }

    public addChangeListener(handler: (t: T) => void, immediate: boolean = false) {
        this.changeListeners.push(handler)
        if (immediate) handler(this.payload)
        return () => {
            this.changeListeners = this.changeListeners.filter(x => x !== handler)
        }
    }

    private get payload (): T {
        return JSON.parse(this.storage.getItem(this.key) || 'null')
    }

    private set payload (pld: T) {
        this.storage.setItem(this.key, JSON.stringify(pld))
        this.onStorageChanged()
    }

    public getItem<K extends keyof T>(key: K): T[K] {
        const payload = this.payload
        return payload && payload[key]
    }

    public getPayload() {
        return this.payload
    }

    public setPayload(payload: T) {
        this.payload = payload
    }

    public updatePayload(payload: Partial<T>) {
        this.setPayload({
            ...payload as object,
            ...this.payload as object
        } as T)
    }

    public clear() {
        this.storage.removeItem(this.key)
        this.onStorageChanged()
    }

    public destroy() {
        this.removeHandler()
    }

    public addStorageEventListener(handle: (o?: T) => void) {
        const handler = (ev: StorageEvent) => {
            if(ev.key === this.key) {
                handle(this.payload)
            }
        }

        addEventListener('storage', handler)
        return () => {
            removeEventListener('storage', handler)
        }
    }

    public isEmpty() {
        return !this.payload
    }
}
