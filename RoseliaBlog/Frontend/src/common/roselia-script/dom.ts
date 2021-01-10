import * as _ from '@/common/fake-lodash'
import { RoseliaVNode, isEmptyVNode, isTextVNode, isNativeVNode, vNodeHasProps, getVNodeTypeTag, RoseliaFunctionVNode, RoseliaNativeVNode, isFunctionVNode, RoseliaEmptyVNode, RoseliaText, areSameType, isFragmentVNode, RoseliaControllVNode, isControllVNode } from './vnode'
import { Scheduler } from './scheduler';
import { Fiber } from './fiber';
import { RoseliaStateUpdater } from './states'
import { UnitFunction } from './script-types';
import { StateHook, StateHookType, RoseliaHooks, EffectHook, isDependencyChanged, EffectHookType, MemoHook, MemoHookType } from './hooks';
import { ContextNode, IRoseliaScriptContext, lookupContext } from './context';


// On event listeners.
const isEvent = (key: string) => key.startsWith("on")
const isProps = (key: string) => key !== 'children' && !isEvent(key)
function updateDom(dom: Element, newProps: object, oldProps: object) {
    const oldPropKeys = Object.keys(oldProps)
    oldPropKeys
        .filter(isEvent)
        .filter(key => !(key in newProps) || oldProps[key] !== newProps[key])
        .forEach(name => {
            const eventType = name.substring(2).toLowerCase()
            dom.removeEventListener(eventType, oldProps[name])
        })
    
    oldPropKeys.filter(isProps).filter(key => !(key in newProps))
        .forEach(name => dom[name] = '')
    
    const newPropKeys = Object.keys(newProps)
    newPropKeys
        .filter(isEvent)
        .filter(key => oldProps[key] !== newProps[key])
        .forEach(name => {
            const eventType = name.substring(2).toLowerCase()
            dom.addEventListener(eventType, newProps[name])
        })
    
    const mutations = newPropKeys
        .filter(isProps)
        .filter(key => oldProps[key] !== newProps[key])
    
    _.merge(dom, _.pick(newProps, mutations as any))
}

function createDom(vNode: RoseliaVNode) {
    if (isEmptyVNode(vNode)) {
        return null;
    }
    if (isTextVNode(vNode)) {
        return document.createTextNode(vNode.toString())
    }
    if (isNativeVNode(vNode) && vNode.tag) {
        const node = document.createElement(vNode.tag)
        
        updateDom(node, vNode.props, {})
        if (vNode.props.ref) {
            if (_.isFunction(vNode.props.ref)) {
                const callback = vNode.props.ref
                node.addEventListener('mounted', () => {
                    callback.call(node, node)
                })
            }
            else vNode.props.ref.current = node
        }

        return node;
    }
    
    return null;
    // const rendered = vNode.tag(vNode.props);
    // return createDom(rendered);
}

function getTextOfVNode(node: RoseliaText | RoseliaEmptyVNode) {
    if (isTextVNode(node)) return node.toString();
    else return '';
}

type FiberWithVNodeTypeOf<T extends RoseliaVNode> = Fiber & { vNode: T };

const commitDeletion = (fiber: Fiber, domParent: HTMLElement) => {
    fiber.effectTag = 'deletion';
    if (isFragmentVNode(fiber.vNode)) {
        removeFragment(fiber, domParent);
        return;
    }
    if (fiber.dom) {
        // domParent.removeChild(fiber.dom)
        fiber.dom.dispatchEvent(new Event('beforeDestroy'))
        fiber.dom.parentNode?.removeChild(fiber.dom)
    }
    else if (fiber.child) commitDeletion(fiber.child, domParent)
}

const removeFragment = (fiber: Fiber, domParent: HTMLElement) => {
    let currentFiber = fiber.child;
    while (currentFiber) {
        commitDeletion(currentFiber, domParent);
        currentFiber = currentFiber.sibling;
    }
}

const findNextSibling = (fiber?: Fiber) => {
    while (fiber && !fiber.sibling) {
        fiber = fiber.parent
    }

    return fiber?.sibling
}

export class RoseliaDomOwner {
    private domScheduler: Scheduler<Fiber>
    private wipRoot: Fiber | null = null
    private currentFiber: Fiber | null = null
    private hookIndex: number = 0
    private currentRoot: Fiber | null = null
    private deletions: Fiber[] = []
    private domUpdatedCallback?: UnitFunction

    public static currentActiveOwner: RoseliaDomOwner

    public constructor() {
        this.domScheduler = new Scheduler(fiber => this.performUpdateWork(fiber));
        this.domScheduler.whenWorkIsEmpty(() => this.wipRoot && this.commitRoot())
        this.domScheduler.summon()
    }

    public render(vNode: RoseliaVNode, container: HTMLElement) {
        this.wipRoot = {
            dom: container,
            vNode,
            alternate: this.currentRoot,
            effectTag: 'placement'
        }
    
        this.domScheduler.changeWorkTo(this.wipRoot)
    }

    public refresh() {
        this.wipRoot = {
            dom: this.currentRoot?.dom || null,
            vNode: this.currentRoot?.vNode,
            alternate: this.currentRoot,
            effectTag: 'update'
        }
        this.deletions = []
        this.domScheduler.changeWorkTo(this.wipRoot)
    }

    private useRefresh() {
        const fiber = this.currentFiber;
        return () => {
            this.wipRoot = {
                dom: fiber?.dom || null,
                vNode: fiber?.vNode,
                alternate: fiber,
                effectTag: 'update'
            }
            this.deletions = [];
            this.domScheduler.changeWorkTo(this.wipRoot)
        }
    }

    public destroy() {
        this.domScheduler.kill()
    }

    private withHook<H extends RoseliaHooks, T>(fn: (hook?: H) => [H, T]) {
        const oldHook = this.currentFiber?.alternate?.hooks?.[this.hookIndex] as H | undefined
        const [newHook, returnValue] = fn(oldHook);
        this.currentFiber?.hooks?.push(newHook)
        ++this.hookIndex;
        return returnValue
    }

    public useEffect(callback: () => UnitFunction | undefined, deps: any[]) {
        return this.withHook((oldHook?: EffectHook) => {
            const isDepChanged = !oldHook || isDependencyChanged(oldHook.deps, deps)
            const newHook: EffectHook = {
                type: EffectHookType,
                deps,
                clearEffect: oldHook?.clearEffect
            }
            if (isDepChanged) {
                newHook.clearEffect?.()
                newHook.clearEffect = callback();
            }
            return [newHook, undefined]
        })
    }

    public useMemo<T>(compute: () => T, deps: any[]): T {
        return this.withHook((oldHook?: MemoHook<T>) => {
            const newHook: MemoHook<T> = {
                type: MemoHookType,
                value: oldHook?.value || null,
                deps
            }
            const isDepChanged = !oldHook || isDependencyChanged(oldHook.deps, deps);
            if (isDepChanged) {
                newHook.value = compute();
            }
            return [newHook, newHook.value as T]
        })
    }

    public useCallback<T>(callback: T, deps: any[]) {
        return this.useMemo(() => callback, deps);
    }

    public useState<S>(initialState: S | (() => S)): [S, RoseliaStateUpdater<S>] {
        const oldHook = this.currentFiber?.alternate?.hooks?.[this.hookIndex] as StateHook<S> | null
        const hook: StateHook<S> = oldHook || {
            type: StateHookType,
            state: (initialState instanceof Function ? initialState() : initialState),
            queue: [],
            setState: action => {
                hook.queue.push(action)
                // refresh()
                this.refresh()
            }
        }

        if (oldHook) {
            oldHook?.queue.forEach(action => {
                hook.state = action instanceof Function ? action(hook.state) : action
            })
            oldHook.queue = []
        }

        this.currentFiber?.hooks?.push(hook)
        ++this.hookIndex;
        return [hook.state, hook.setState]
    }

    public useContext<T>(context: IRoseliaScriptContext<T>): T {
        return lookupContext(context, this.currentFiber ?? undefined)
    }

    public whenDomUpdated(callback: UnitFunction) {
        this.domUpdatedCallback = callback
    }

    private performUpdateWork(fiber: Fiber) {
        RoseliaDomOwner.currentActiveOwner = this;
        if (isFunctionVNode(fiber.vNode)) {
            // TS typechecker can not realize the type is fit here.
            this.updateFunctionVNode(fiber as any)
        } else if (isControllVNode(fiber.vNode)) {
            this.updateControllNode(fiber as any)
        } else {
            this.updateHostVNode(fiber as any)
        }
    
        // Return next work. Find by child -> sibling -> uncle.
        // Which is a DFS tear down to loop and cps.
        if (fiber.child) return fiber.child
        let nextFiber: Fiber | undefined = fiber
        while (nextFiber) {
            if (nextFiber.sibling) return nextFiber.sibling
            nextFiber = nextFiber.parent
        }
        return null;
    }

    private commitRoot() {
        this.deletions.forEach(node => this.commitWork(node))
        this.deletions = []
        this.commitWork(this.wipRoot?.child);
        this.currentRoot = this.wipRoot
        if (this.wipRoot?.alternate) {
            // To ensure old fiber could be cleaned by GC.
            this.wipRoot.alternate.alternate = null;
        }
        this.wipRoot = null;
        this.domUpdatedCallback?.()
    }

    private commitWork (fiber: Fiber | null | undefined) {
        if (!fiber) return;
    
        let domParentFiber = fiber.parent
        while (!domParentFiber?.dom) {
            domParentFiber = domParentFiber?.parent
        }
    
        const domParent = domParentFiber.dom
        if (fiber.effectTag === 'placement' && fiber.dom) {
            const sibling = findNextSibling(fiber)
            if (sibling?.dom && domParent.contains(sibling.dom)) domParent.insertBefore(fiber.dom, sibling.dom)
            else domParent.appendChild(fiber.dom)
            fiber.dom.dispatchEvent(new Event('mounted'))
        } else if (
            fiber.effectTag === 'update' &&
            fiber.dom
        ) { 
            if (vNodeHasProps(fiber.vNode) && vNodeHasProps(fiber.alternate?.vNode)) {
                updateDom(fiber.dom, fiber.vNode.props, fiber.alternate?.vNode.props)
            } else {
                updateDom(fiber.dom, {
                    textContent: getTextOfVNode(fiber.vNode as RoseliaText)
                }, {
                    textContent: getTextOfVNode(fiber.alternate?.vNode as RoseliaText)
                });
            }
        } else if (fiber.effectTag === 'deletion') {
            commitDeletion(fiber, domParent)
            fiber.hooks?.forEach(hook => {
                if (hook.type === EffectHookType) {
                    hook.clearEffect?.()
                }
            })
        }
        this.commitWork(fiber.child)
        this.commitWork(fiber.sibling)
    }

    private reconcileChildren (fiber: Fiber, elements: RoseliaVNode[]) {
        let oldFiber = fiber.alternate?.child
        let index = 0
        let prevSibling: Fiber | null = null
    
        while (
            index < elements.length ||
            oldFiber
        ) {
            const element = elements[index]
            let newFiber: Fiber | null = null
            const sameType = areSameType(oldFiber?.vNode, element)
            if (oldFiber && sameType) {
                // Should update
                newFiber = {
                    dom: oldFiber.dom,
                    parent: fiber,
                    alternate: oldFiber,
                    vNode: element,
                    effectTag: 'update'
                }
            } else {
                // Should add
                newFiber = {
                    dom: null,
                    parent: fiber,
                    alternate: null,
                    effectTag: 'placement',
                    vNode: element
                }
    
                if (oldFiber) {
                    // Should delete.
    
                    oldFiber.effectTag = 'deletion'
                    this.deletions.push(oldFiber)
                }
            }
    
            oldFiber = oldFiber?.sibling
    
            if (index === 0) {
                fiber.child = newFiber!
            } else if (prevSibling) {
                prevSibling.sibling = newFiber!
            }
    
            prevSibling = newFiber
            ++index
        }
    }

    private updateFunctionVNode(fiber: FiberWithVNodeTypeOf<RoseliaFunctionVNode>) {
        this.currentFiber = fiber
        this.hookIndex = 0
        this.currentFiber.hooks = []
        let result: RoseliaVNode = null
        try {
            result = fiber.vNode.tag(fiber.vNode.props)
        } catch (e) {
            console.error('Rendering virtual node:', fiber.vNode, fiber.vNode.tag)
            console.error(e);
        }

        const children = [result]
        this.reconcileChildren(fiber, children)
    }
    
    private updateHostVNode (fiber: FiberWithVNodeTypeOf<RoseliaEmptyVNode | RoseliaText | RoseliaNativeVNode>) {
        if (!fiber.dom) {
            fiber.dom = createDom(fiber.vNode) as HTMLElement
        }
    
        if (vNodeHasProps(fiber.vNode)) this.reconcileChildren(fiber, fiber.vNode.props.children)
    }

    private updateControllNode(fiber: FiberWithVNodeTypeOf<RoseliaControllVNode>) {
        switch (fiber.vNode.tag) {
            case ContextNode:
                this.reconcileChildren(fiber, [fiber.vNode.child])
                return;
        }
    }
}

const domOwners: RoseliaDomOwner[] = []

export interface IManagedDom {
    owner: RoseliaDomOwner
    refresh: UnitFunction
    destroy: UnitFunction
}

export const render = (node: RoseliaVNode, container: HTMLElement): IManagedDom => {
    const owner = new RoseliaDomOwner();
    domOwners.push(owner)
    owner.render(node, container)

    return {
        owner,
        refresh: () => owner.refresh(),
        destroy: () => {
            owner.destroy();
            const index = domOwners.indexOf(owner)
            if (index > -1) domOwners.splice(index, 1)
        }
    }
}

export const refresh = () => domOwners.forEach(owner => owner.refresh());

export const useState = <S>(initialState: S | (() => S)): [S, RoseliaStateUpdater<S>] => {
    return RoseliaDomOwner.currentActiveOwner.useState(initialState)
}
