import { createElementWithArray as createElement, RoseliaVNode, RoseliaFunctionComponent, RoseliaNativeVNode, RoseliaFunctionVNode, isRoseliaVNode } from './vnode'
import { RecursivePartial } from './script-types';
import * as _ from '../fake-lodash'

export function h(vNodes: RoseliaVNode[]): RoseliaVNode

export function h<T extends keyof HTMLElementTagNameMap>(
    tag: T,
    props: RecursivePartial<HTMLElementTagNameMap[T]>,
    children: RoseliaVNode[]): RoseliaNativeVNode

export function h<T extends keyof HTMLElementTagNameMap>(
    tag: T,
    props: RecursivePartial<HTMLElementTagNameMap[T]>,
    ...children: RoseliaVNode[]): RoseliaNativeVNode

export function h(
    tag: string,
    props: object,
    ...children: RoseliaVNode[]
): RoseliaVNode

export function h<T extends keyof HTMLElementTagNameMap>(
    tag: T,
    ...children: RoseliaVNode[]): RoseliaNativeVNode

export function h<P = {}>(
    component: RoseliaFunctionComponent<P>,
    props: P,
    children: RoseliaVNode[]): RoseliaFunctionVNode

export function h<P = {}>(
    component: RoseliaFunctionComponent<P>,
    props: P,
    ...children: RoseliaVNode[]): RoseliaFunctionVNode

export function h<P = {}>(
    component: RoseliaFunctionComponent<P>,
    ...children: RoseliaVNode[]
): RoseliaFunctionVNode

export function h(
    tagOrComponent: Function | keyof HTMLElementTagNameMap | string | RoseliaVNode[],
    props?: object | RoseliaVNode,
    ...children: (RoseliaVNode | RoseliaVNode[])[]
) {
    if (_.isArray(tagOrComponent)) return createElement(tagOrComponent)

    if (isRoseliaVNode(props) || _.isArray(props)) {
        children = [props, ...children]
        props = {}
    }

    return createElement(tagOrComponent as any, props, children.flat())
}

const cached = <T, U>(fn: (arg: T) => U) => {
    const cache = new Map<T, U>();
    return (arg: T) => {
        if (cache.has(arg)) {
            return cache.get(arg)!;
        }
        const result = fn(arg);
        cache.set(arg, result);
        return result;
    }
}

export const isValidHTMLTag = cached((tag: string): tag is keyof HTMLElementTagNameMap => {
    const element = document.createElement(tag);
    return element.toString() !== '[object HTMLUnknownElement]';
});

export const getAssigner = cached(<K extends keyof HTMLElementTagNameMap>(tag: K): HyperScriptCreater[K] => {
    return (...args: any[]) => h(tag, ...args)
})

export interface HyperScriptFragment {
    Fragment: (...children: (RoseliaVNode | RoseliaVNode[])[]) => RoseliaVNode;
}
export type HyperScriptCreater = typeof h & {
    [K in keyof HTMLElementTagNameMap]: (props?: RecursivePartial<HTMLElementTagNameMap[K]> | RoseliaVNode, ...children: RoseliaVNode[]) => RoseliaNativeVNode;
} & HyperScriptFragment

export const hyperScript = new Proxy(h as HyperScriptCreater, {
    has(target, name: string) {
        return Reflect.has(target, name) || isValidHTMLTag(name);
    },
    get(target, name: string) {
        if (Reflect.has(target, name)) {
            return Reflect.get(target, name);
        }
        if (name === 'Fragment') {
            return ((...children) => h(children.flat())) as HyperScriptFragment['Fragment']
        }
        return getAssigner(name as keyof HTMLElementTagNameMap)
    }
});
