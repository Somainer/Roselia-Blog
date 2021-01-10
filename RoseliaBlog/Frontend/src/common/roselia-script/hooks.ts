import { RoseliaStateUpdaterProp, RoseliaStateUpdater } from './states'

export const StateHookType = 'state'
export interface StateHook<T = any> {
    type: typeof StateHookType
    state: T
    queue: RoseliaStateUpdaterProp<T>[]
    setState: RoseliaStateUpdater<T>
}

export type DependencyArray = any[];
export const EffectHookType = 'effect'
export interface EffectHook {
    type: typeof EffectHookType
    deps: DependencyArray
    clearEffect?: Dispatch<void>
}

export const MemoHookType = 'memo'
export interface MemoHook<T = any> {
    type: typeof MemoHookType,
    value: T | null
    deps: DependencyArray
}

export const isDependencyChanged = (oldDeps: DependencyArray, newDeps: DependencyArray) => {
    return oldDeps.length !== newDeps.length || oldDeps.some((v, i) => v !== newDeps[i]);
}

export type RoseliaHooks = StateHook | EffectHook | MemoHook
