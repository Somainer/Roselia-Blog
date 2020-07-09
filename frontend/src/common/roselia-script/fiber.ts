import { RoseliaVNode } from './vnode';
import { RoseliaStateUpdaterProp } from './states'


export interface StateHook<T = any> {
    state: T
    queue: RoseliaStateUpdaterProp<T>[]
}

export interface Fiber {
    dom: HTMLElement | null
    parent?: Fiber
    child?: Fiber
    sibling?: Fiber
    vNode: RoseliaVNode
    alternate: Fiber | null
    effectTag: DomChangeType
    hooks?: StateHook[]
}

export type DomChangeType = 'update' | 'placement' | 'deletion'
