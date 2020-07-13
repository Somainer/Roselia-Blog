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

    if (isRoseliaVNode(props)) {
        children = [props, ...children]
        props = {}
    }

    return createElement(tagOrComponent as any, props, children.flat())
}
