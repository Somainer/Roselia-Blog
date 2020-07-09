import * as _ from '@/common/fake-lodash'
import { RoseliaVNode, isEmptyVNode, isTextVNode, isNativeVNode, vNodeHasProps, getVNodeTypeTag, RoseliaFunctionVNode, RoseliaNativeVNode, isFunctionVNode, RoseliaEmptyVNode, RoseliaText, areSameType } from './vnode'
import { Scheduler } from './scheduler';
import { Fiber, StateHook } from './fiber';
import { RoseliaStateUpdater } from './states'
import { UnitFunction } from './script-types';


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
            if (_.isFunction(vNode.props.ref)) vNode.props.ref(node)
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
    if (fiber.dom) {
        // domParent.removeChild(fiber.dom)
        fiber.dom.parentNode?.removeChild(fiber.dom)
    }
    else if (fiber.child) commitDeletion(fiber.child, domParent)
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

    public destroy() {
        this.domScheduler.kill()
    }

    public useState<S>(initialState: S | (() => S)): [S, RoseliaStateUpdater<S>] {
        const oldHook = this.currentFiber?.alternate?.hooks?.[this.hookIndex] as StateHook<S> | null
        const hook: StateHook<S> = {
            state: oldHook?.state || (initialState instanceof Function ? initialState() : initialState),
            queue: []
        }

        oldHook?.queue.forEach(action => {
            hook.state = action instanceof Function ? action(hook.state) : action
        })

        const setState: RoseliaStateUpdater<S> = action => {
            hook.queue.push(action)
            this.refresh()
        }

        this.currentFiber?.hooks?.push(hook)
        ++this.hookIndex;
        return [hook.state, setState]
    }

    public whenDomUpdated(callback: UnitFunction) {
        this.domUpdatedCallback = callback
    }

    private performUpdateWork(fiber: Fiber) {
        RoseliaDomOwner.currentActiveOwner = this;
        if (isFunctionVNode(fiber.vNode)) {
            // TS typechecker can not realize the type is fit here.
            this.updateFunctionVNode(fiber as any)
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
            console.log('Rendering virtual node:', fiber.vNode, fiber.vNode.tag.toString())
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
