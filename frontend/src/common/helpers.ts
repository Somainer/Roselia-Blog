export const camelCaseToUnderline = (s: string) => s.replace(/([A-Z])/g, "_$1").toLowerCase()
export const underlineToCamelCase = (s: string) => s.replace(/_([a-zA-Z])/g, (_, s) => s.toUpperCase())

export const mapEntries = (fn: (key: string, value: any) => any) => (obj: Object) => Object.entries(obj).map(([k, v]) => fn(k, v))

export const tupleToDict = (tuples: [string, any][]) => tuples.reduce((o, arr) => ({
    ...o,
    [arr[0]]: arr[1]
}), {})

export const mapKeys = (fn: (s: string) => string) => (obj: object) => tupleToDict(mapEntries((s, a) => [fn(s), a])(obj))

// export const mapKeys = (fn: (s: string) => string) => (obj: object) => Object.entries(obj).map(([k, v]) => [fn(k), v]).reduce((o, arr) => ({
//     ...o,
//     [arr[0]]: arr[1]
// }), {})

export const mapToCamelCase = mapKeys(underlineToCamelCase)

export const mapToUnderline = mapKeys(camelCaseToUnderline)

export const safeDictGet = (...path: string[]) => (obj: object) => path.reduce((acc, attr) => typeof acc === 'undefined' ? undefined : acc[attr], obj)

export const caselessEqual = (a: string, b: string) => {
    if (a === b) return true
    if (!a || !b) return false
    return a.toLowerCase() === b.toLowerCase()
}
