export type ToCamelCase<S> =
    S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<ToCamelCase<Tail>>}`
    : S;

export type ToSnakeCase<S> =
    S extends `${infer Head}${infer Tail}`
    ? `${Head extends Capitalize<Head> ? "_" : ""}${Lowercase<Head>}${ToSnakeCase<Tail>}`
    : S;

export type ToCamelCaseObject<T> =
    T extends object ?
    { [K in keyof T as ToCamelCase<K>]: ToCamelCaseObject<T[K]> }
    : T extends ReadonlyArray<infer P> ? ReadonlyArray<ToCamelCaseObject<P>>
    : T;

export type ToSnakeCaseObject<T> =
    T extends object ?
    { [K in keyof T as ToSnakeCase<K>]: ToSnakeCaseObject<T[K]> }
    : T extends ReadonlyArray<infer P> ? ReadonlyArray<ToSnakeCaseObject<P>>
    : T;

export type Func<T, U> = (arg: T) => U;

export const camelCaseToUnderline = <S extends string>(s: S): ToSnakeCase<S> => s.replace(/([A-Z])/g, "_$1").toLowerCase() as ToSnakeCase<S>
export const underlineToCamelCase = <S extends string>(s: S): ToCamelCase<S> =>
    s.replace(/_([a-zA-Z])/g, (_, s) => s.toUpperCase()) as ToCamelCase<S>

export const mapEntries = (fn: (key: string, value: any) => any) => (obj: Object) => Object.entries(obj).map(([k, v]) => fn(k, v))

export type TupleToDict<Tuple> =
    Tuple extends [[infer K, infer V], ...infer Args]
    ? K extends string ? Record<K, V> & TupleToDict<Args> : never
    : Tuple extends [] ? never : object;

export const tupleToDict = <T extends [string, any][]>(tuples: T): TupleToDict<T> => tuples.reduce((o, arr) => ({
    ...o,
    [arr[0]]: arr[1]
}), {}) as any

export const mapKeys = (fn: (s: string) => string) => (obj: object) => tupleToDict(mapEntries((s, a) => [fn(s), a])(obj))

export function mapValues<T, U>(fn: (s: T[keyof T]) => U) {
    return (obj: T) => Object.assign({}, ...Object.entries(obj).map(([k, v]) => ({[k]: fn(v)})))
}

export const deepMapKeys = (fn: (s: string) => string) => (obj: object): object => {
    if (obj instanceof Array) return obj.map(deepMapKeys(fn))
    if (obj && typeof obj === 'object') {
        return tupleToDict(mapEntries((k, v) => {
            return [fn(k), deepMapKeys(fn)(v)]
        })(obj))
    }
    return obj
}

// export const mapKeys = (fn: (s: string) => string) => (obj: object) => Object.entries(obj).map(([k, v]) => [fn(k), v]).reduce((o, arr) => ({
//     ...o,
//     [arr[0]]: arr[1]
// }), {})

export const mapToCamelCase: <T>(value: T) => ToCamelCaseObject<T> = deepMapKeys(underlineToCamelCase) as any

export const mapToUnderline: <T>(value: T) => ToSnakeCaseObject<T> = deepMapKeys(camelCaseToUnderline) as any

export const safeDictGet = (...path: string[]) => (obj: object) => path.reduce((acc, attr) => typeof acc === 'undefined' ? undefined : acc[attr], obj)

export const caselessEqual = (a: string, b: string) => {
    if (a === b) return true
    if (!a || !b) return false
    return a.toLowerCase() === b.toLowerCase()
}

export const getLuminance = (red: number, green: number, blue: number) => (
    red * 299 + green * 587 + blue * 114
) / 1000

const splitRGB = (color: string) => color.match(/\d+/g)!.map(n => parseInt(n, 10))

export const isBright = (color: string) => {
    if (! color) return 
    const lowerColor = color.toLowerCase()
    let luminance: number
    if (lowerColor.startsWith('rgb')) {
        const rgb = splitRGB(lowerColor)
        luminance = getLuminance(rgb[0], rgb[1], rgb[2])
    } else {
        let hexColor = lowerColor.substring(1)
        if (hexColor.length === 3) hexColor = hexColor.split('').map(s => s + s).join('')
        if (hexColor.length !== 6) return undefined
        const rgb = hexColor.replace(/(..)(?=.)/g, "$1-").split('-').map(s => parseInt(s, 16))
        luminance = getLuminance(rgb[0], rgb[1], rgb[2])
    }
    return luminance >= 128
}

export function selectByLuminance<T>(color: string, onBright: T, onDark: T, defaultValue: T) {
    const result = isBright(color)
    if (typeof result === 'undefined') return defaultValue
    return result ? onBright : onDark
}

export function selfish<T extends object, U extends object>(target: T, bindContext?: U) {
    const cache = new WeakMap
    return new Proxy(target, {
        get(obj, key) {
            const result = Reflect.get(obj, key)
            if(typeof result === 'function') {
                if(!cache.has(result)) {
                    cache.set(result, result.bind(bindContext || obj))
                }
                return cache.get(result)
            }
            return result
        }
    })
}

export const randomId = () => Math.random().toString(36).substring(2)
