export const camelCaseToUnderline = (s: string) => s.replace(/([A-Z])/g, "_$1").toLowerCase()
export const underlineToCamelCase = (s: string) => s.replace(/_([a-zA-Z])/g, (_, s) => s.toUpperCase())

export const mapKeys = (fn: (s: string) => string) => (obj: object) => Object.entries(obj).map(([k, v]) => [fn(k), v]).reduce((o, arr) => ({
    ...o,
    [arr[0]]: arr[1]
}), {})

export const mapToCamelCase = mapKeys(underlineToCamelCase)

export const mapToUnderline = mapKeys(camelCaseToUnderline)

export const safeDictGet = (...path: string[]) => (obj: object) => path.reduce((acc, attr) => typeof acc === 'undefined' ? undefined : acc[attr], obj)
