import * as _ from '@/common/fake-lodash'
import { RecursivePartial, RefObject } from "./script-types";

export type RoseliaText = string | number
export type RoseliaEmptyVNode = boolean | null | undefined
export type RoseliaVNode = RoseliaFunctionVNode | RoseliaNativeVNode | RoseliaText | RoseliaEmptyVNode

interface RefProp {
    ref?: ((node: Node) => void) | RefObject<Node>
}

export const isEmptyVNode = (node: RoseliaVNode): node is RoseliaEmptyVNode => _.isNil(node) || _.isBoolean(node)
export const isTextVNode = (node: RoseliaVNode): node is RoseliaText => _.isString(node) || _.isNumber(node)
export const isFunctionVNode = (node: RoseliaVNode): node is RoseliaFunctionVNode => _.isObject(node) && _.isFunction(node.tag)
export const isNativeVNode = (node: RoseliaVNode): node is RoseliaNativeVNode => _.isObject(node) && _.isString(node.tag)
export const vNodeHasProps = (node: RoseliaVNode): node is RoseliaNativeVNode | RoseliaFunctionVNode => _.isObject(node) && _.isObject(node.props)
export const isRoseliaVNode = (maybeNode: any): maybeNode is RoseliaVNode =>
    isEmptyVNode(maybeNode) || isTextVNode(maybeNode) || isFunctionVNode(maybeNode) || isNativeVNode(maybeNode)

export type VNodeType = 'empty' | 'text' | 'function' | 'native'
export const getVNodeTypeTag = (node: RoseliaVNode): VNodeType => {
    if (isEmptyVNode(node)) return 'empty'
    if (isTextVNode(node)) return 'text'
    if (isNativeVNode(node)) return 'native'
    return 'function'
}
export const areSameType = (lhs: RoseliaVNode, rhs: RoseliaVNode) => {
    if (getVNodeTypeTag(lhs) !== getVNodeTypeTag(rhs)) return false;

    if (isNativeVNode(lhs) && isNativeVNode(rhs)) {
        return lhs.tag === rhs.tag
    }

    // EmptyNode and TextNode are same, because they are both rendered to Text.
    // Functional nodes are same.
    return true;
}

export interface RoseliaFunctionVNode<T = any> extends Keyable {
    tag: (prop: T) => RoseliaVNode
    props: WithChildren<T>
}

export interface RoseliaNativeVNode<T extends keyof HTMLElementTagNameMap | string = string> extends Keyable {
    tag: T
    props: WithChildren<T extends keyof HTMLElementTagNameMap ? RecursivePartial<HTMLElementTagNameMap[T]> : object> & RefProp
}

interface Keyable {
    key?: number | string
}

type WithChildren<T> = T & {
    children: RoseliaVNode[]
}

export interface RoseliaFunctionComponent<P = {}> {
    (props: WithChildren<P>, context?: any): RoseliaVNode | null
}

export function createElement<T extends keyof HTMLElementTagNameMap>(
    tag: T,
    props: Keyable & RecursivePartial<HTMLElementTagNameMap[T]> | null,
    ...children: RoseliaVNode[]): RoseliaNativeVNode<T>;
export function createElement<P>(
    tag: RoseliaFunctionComponent<P>,
    props: Keyable & P | null,
    ...children: RoseliaVNode[]): RoseliaFunctionVNode<P>;
export function createElement(elements: RoseliaVNode[]): RoseliaVNode;
export function createElement(
    tag: keyof HTMLElementTagNameMap | Function | string | RoseliaVNode[],
    props: Keyable & object | null = null,
    ...children: RoseliaVNode[]): RoseliaVNode {
    if (_.isArray(tag)) {
        return {
            tag: '',
            props: {
                children: tag
            }
        }
    }
    return {
        tag: tag as any, // Skipping type-check here, ts does not realize these are structural equal.
        props: {
            ...(props || {}),
            children
        },
        key: props?.key
    }
}

export function createElementWithArray(elements: RoseliaVNode[]): RoseliaVNode
export function createElementWithArray(tag: string, props: object, children: RoseliaVNode[]): RoseliaVNode
export function createElementWithArray<P>(component: RoseliaFunctionComponent<P>, props: P, children: RoseliaVNode[]): RoseliaVNode
export function createElementWithArray(
    tag: keyof HTMLElementTagNameMap | Function | string | RoseliaVNode[],
    props: Keyable & object | null = null,
    children?: RoseliaVNode[]
): RoseliaVNode {
    if (_.isArray(tag)) return createElement(tag)

    return {
        tag: tag as any,
        props: {
            ...(props || {}),
            children,
        },
        key: props?.key
    }
}
