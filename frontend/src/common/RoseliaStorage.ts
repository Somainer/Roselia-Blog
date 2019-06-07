export class RoseliaStorage<T extends object = any> {
    private readonly key: string
    private readonly storage: Storage
    private changeListeners: ((s: T) => void)[] = []

    constructor(key: string, storage = localStorage) {
        this.key = key
        this.storage = storage
        this.addStorageEventListener(() => this.onStorageChanged())
    }

    private onStorageChanged() {
        const payload = this.payload
        this.changeListeners.forEach(l => l(payload))
    }

    public addChangeListener(handler: (t: T) => void) {
        this.changeListeners.push(handler)
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

    public getItem(key: keyof T) {
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

    public addStorageEventListener(handle: (o?: T) => void) {
        addEventListener('storage', ev => {
            if(ev.key === this.key) {
                handle(this.payload)
            }
        })
    }

    public isEmpty() {
        return !this.payload
    }
}
