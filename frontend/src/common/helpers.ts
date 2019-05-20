export const camelCaseToUnderline = (s: string) => s.replace(/([A-Z])/g, "_$1").toLowerCase()
export const underlineToCamelCase = (s: string) => s.replace(/_([a-zA-Z])/g, (_, s) => s.toUpperCase())

export const mapEntries = (fn: (key: string, value: any) => any) => (obj: Object) => Object.entries(obj).map(([k, v]) => fn(k, v))

export const tupleToDict = (tuples: [string, any][]) => tuples.reduce((o, arr) => ({
    ...o,
    [arr[0]]: arr[1]
}), {})

export const mapKeys = (fn: (s: string) => string) => (obj: object) => tupleToDict(mapEntries((s, a) => [fn(s), a])(obj))

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

export const mapToCamelCase = deepMapKeys(underlineToCamelCase)

export const mapToUnderline = deepMapKeys(camelCaseToUnderline)

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