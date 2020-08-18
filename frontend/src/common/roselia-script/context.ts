import { RoseliaFunctionComponent, createElement, isControllVNode } from "./vnode";
import { Fiber } from './fiber'

export const ContextNode = Symbol('roselia-context');

export interface IRoseliaContextProvider<T> extends RoseliaFunctionComponent<{
    value: T
}> {
    $defaultValue: T
}

export interface IRoseliaScriptContext<T> {
    Provider: IRoseliaContextProvider<T>
    ContextSymbol: symbol
}

export const createContext = <T>(defaultValue: T): IRoseliaScriptContext<T> => {
    const marker = Symbol()
    const provider: IRoseliaContextProvider<T> = ({ value, children }) => {
        return {
            tag: ContextNode,
            props: { value, contextSymbol: marker },
            child: createElement(children)
        }
    }
    provider.$defaultValue = defaultValue;

    return {
        Provider: provider,
        ContextSymbol: marker
    }
}

export const lookupContext = <T>(context: IRoseliaScriptContext<T>, fiber?: Fiber) => {
    let currentFiber = fiber;
    while (currentFiber) {
        if (isControllVNode(currentFiber.vNode) && currentFiber.vNode.tag === ContextNode) {
            if (currentFiber.vNode.props.contextSymbol === context.ContextSymbol) {
                return currentFiber.vNode.props.value
            }
        }
        currentFiber = currentFiber.parent
    }
    return context.Provider.$defaultValue;
}
