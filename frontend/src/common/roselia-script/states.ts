import { Optional, UnitFunction } from './script-types'

class RoseliaInternalWrappedState<T> {
    readonly value: T
    public constructor(value: T) {
        this.value = value
    }
}

type RoseliaStateUpdateCallback = (key: string, newValue: any, oldValue: any) => void;
export type RoseliaStateUpdaterProp<T> = (T | ((t: T) => T));
export type RoseliaStateUpdater<T> = (v: RoseliaStateUpdaterProp<T>) => void

class RoseliaManagedState {
    public state: Record<string, any> = {};

    public static create(updateCallback: RoseliaStateUpdateCallback) {
        const managedState = new RoseliaManagedState()
        return [new Proxy(managedState, {
            has(target, key) { return Reflect.has(target.state || target, key) },
            get(target, key) { return Reflect.get(target.state || target, key) },
            set(target, key, value) {
                if (value instanceof RoseliaInternalWrappedState) {
                    return Reflect.set(target.state || target, key, value.value);
                } else {
                    const oldValue = Reflect.get(target.state || target, key);
                    const result = Reflect.set(target.state || target, key, value);
                    updateCallback(key as string, value, oldValue);
                    return result;
                }
            },
            ownKeys(target) {
                return Reflect.ownKeys(target)
            }
        }), managedState]
    }
}

export class RoseliaScriptState {
    public readonly state: RoseliaManagedState
    public readonly rawState: RoseliaManagedState
    private cell: DynamicCell<[any, RoseliaStateUpdater<any>]>
    private updateCallback: RoseliaStateUpdateCallback | undefined;
    constructor(callback?: RoseliaStateUpdateCallback) {
        this.updateCallback = callback
        const [state, rawState] = RoseliaManagedState.create((key, newValue, oldValue) => {
            this.triggerCallback(key, newValue, oldValue)
        })
        this.state = state;
        this.rawState = rawState
        this.cell = new DynamicCell();
    }

    public triggerCallback(key: string, newValue: any, oldValue: any) {
        this.updateCallback && this.updateCallback(key, newValue, oldValue)
    }

    public setCallback(callback: RoseliaStateUpdateCallback) {
        this.updateCallback = callback;
    }

    public defineState<S>(key: string, value: S | (() => S)) {
        if (key in this.state) return this.state[key];
        this.state[key] = new RoseliaInternalWrappedState(value instanceof Function ? value() : value);
    }

    public useState<S>(state: S | (() => S)): [S, RoseliaStateUpdater<S>] {
        if (!this.cell.currentIsDefined()) {
            // cell for state: [value, updater]
            const index = this.cell.index
            const value = state instanceof Function ? state() : state
            const updater: RoseliaStateUpdater<S> = v => {
                const [oldValue] = this.cell.values[index]
                const newValue = v instanceof Function ? v(oldValue) : v
                this.cell.values[index][0] = newValue
                this.triggerCallback(index.toString(), newValue, oldValue)
            }

            this.cell.setCurrent([value, updater])
        }

        return this.cell.getValueAndAdvance()
    }

    public reset() {
        this.cell.reset()
    }
}

class DynamicCell<T> {
    values: T[] = []
    private currentIndex: number = 0

    public getValueAndAdvance() {
        return this.values[this.currentIndex++]
    }
    public get currentValue() {
        return this.values[this.currentIndex]
    }
    public currentIsDefined() {
        return this.currentIndex < this.values.length
    }
    public setCurrent(value: T) {
        this.values[this.currentIndex] = value
    }
    public advance() {
        ++this.currentIndex
    }
    public reset() {
        this.currentIndex = 0
    }
    public clear() {
        this.values = []
        this.currentIndex = 0
    }

    // To make the inner index read-only.
    public get index() {
        return this.currentIndex
    }
}

export class RoseliaScriptEffect {
    private cell: DynamicCell<[any[], Optional<UnitFunction>]> = new DynamicCell();

    public useEffect(effect: () => Optional<UnitFunction>, deps: any[]) {
        // cell for effect: [deps, clear]
        if (this.cell.currentIsDefined()) {
            const [oldDeps, clearEffect] = this.cell.currentValue
            const changed = oldDeps.length !== deps.length || deps.some((v, i) => v !== oldDeps[i])
            if (changed) {
                clearEffect?.()
                this.cell.setCurrent([deps, effect()])
            }
        } else {
            this.cell.setCurrent([deps, effect()])
        }
        this.cell.advance()
    }

    public reset() {
        this.cell.reset()
    }
    public clear() {
        this.cell.values.forEach(([_v, clean]) => clean?.())
        this.cell.clear()
    }
}
