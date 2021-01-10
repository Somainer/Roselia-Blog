import { RoseliaVNode } from './vnode';
import { RoseliaHooks } from './hooks'


export interface Fiber {
    dom: HTMLElement | null
    parent?: Fiber
    child?: Fiber
    sibling?: Fiber
    vNode: RoseliaVNode
    alternate: Fiber | null
    effectTag: DomChangeType
    hooks?: RoseliaHooks[]
}

export type DomChangeType = 'update' | 'placement' | 'deletion'
