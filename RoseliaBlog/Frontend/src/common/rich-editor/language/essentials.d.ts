/** React-like useState */
declare function useState<S>(state: S | (() => S)): [S, ((up: (S | ((s: S) => S))) => S)]
/** Introduce a variable, then return its value. */
declare function def<T>(variable: string, value: T): T;
/** Introduce multiple variables. */
declare function def(variables: string[], values: []): void;
declare function defState<S>(name: string, state: S | (() => S)): void;
declare function useMemo<S>(init: (() => S), deps: any[]): S;
declare function useReactiveState<S>(init: S | (() => S)): S;
declare function useRef<S>(init: S): { current: S };
declare function changeExtraDisplaySettings(settings: Partial<{
    metaBelowImage: boolean,
    blurMainImage: boolean,
    disableSideNavigation: boolean
}>): void;
interface RoseliaFunctionVNode<T = any> extends Keyable {
    tag: (prop: T) => RoseliaVNode
    props: WithChildren<T>
}

interface RoseliaNativeVNode<T extends keyof HTMLElementTagNameMap | string = string> extends Keyable {
    tag: T
    props: WithChildren<T extends keyof HTMLElementTagNameMap ? RecursivePartial<HTMLElementTagNameMap[T]> : object>
}

interface Keyable {
    key?: number | string
}

type WithChildren<T> = T & {
    children: RoseliaVNode[]
}
type RoseliaText = string | number
type RoseliaEmptyVNode = boolean | null | undefined
type RoseliaVNode = RoseliaFunctionVNode | RoseliaNativeVNode | RoseliaText | RoseliaEmptyVNode
interface RoseliaFunctionComponent<P = {}> {
    (props: WithChildren<P>, context?: any): RoseliaVNode | null
}
type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> :
    T[P];
};

interface RefProp<N = Node> {
    ref?: ((node: N) => void) | { current?: N }
}

type ManagedNativeProps<T> = RecursivePartial<T> & RefProp<T> & Keyable;
declare function $createElement<T extends keyof HTMLElementTagNameMap>(
    tag: T,
    props: ManagedNativeProps<HTMLElementTagNameMap[T]> | null,
    ...children: RoseliaVNode[]): RoseliaNativeVNode<T>;
declare function $createElement<P>(
    tag: RoseliaFunctionComponent<P>,
    props: P | null,
    ...children: RoseliaVNode[]): RoseliaFunctionVNode<P>;
declare function $createElement(elements: RoseliaVNode[]): RoseliaVNode;

declare function createElement<T extends keyof HTMLElementTagNameMap>(
    tag: T,
    props: ManagedNativeProps<HTMLElementTagNameMap[T]> | null,
    children: RoseliaVNode[]): RoseliaNativeVNode<T>;
declare function createElement<P>(
    tag: RoseliaFunctionComponent<P>,
    props: P | null,
    children: RoseliaVNode[]): RoseliaFunctionVNode<P>;
declare function createElement(elements: RoseliaVNode[]): RoseliaVNode;
type HyperScriptCreater = typeof $createElement & {
    [K in keyof HTMLElementTagNameMap]: (props?: ManagedNativeProps<HTMLElementTagNameMap[K]> | RoseliaVNode, ...children: RoseliaVNode[]) => RoseliaNativeVNode;
} & {
    Fragment: (...children: (RoseliaVNode | RoseliaVNode[])[]) => RoseliaVNode;
};
declare var hyperScript: HyperScriptCreater;

interface IRoseliaScriptContext<T> {
    Provider: RoseliaFunctionComponent<{value: T}>
}

declare function createContext<T>(defaultValue: T): IRoseliaScriptContext<T>;
declare function useContext<T>(context: IRoseliaScriptContext<T>): T;

declare function toast(text: string, color: string): void;