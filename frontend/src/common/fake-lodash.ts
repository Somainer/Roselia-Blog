/**
 * Only write necessary functions in lodash.js to reduce chunk size.
 * @author Somainer
 * @module fake-lodash
 */


const getTag = (value: any) => {
    if (value == null) {
        return value === undefined ? '[object Undefined]' : '[object Null]'
    }
    return [].toString.call(value)
}

const isObjectLike = (value: any): boolean => typeof value === 'object' && value !== null
export const isNumber = (value: any): value is number => typeof value === 'number' || (isObjectLike(value) && getTag(value) === '[object Number]')
export const isFunction = (value: any): value is (...args: any[]) => any => typeof value === 'function'
export const isString = (value: any): value is string => {
    const type = typeof value
    return type === 'string' || (type === 'object' && value != null && !Array.isArray(value) && getTag(value) === '[object String]')
}
export const isBoolean = (value: any): value is boolean => typeof value === 'boolean' || (isObjectLike(value) && getTag(value) === '[object Boolean]')
export const isArray = (value: any): value is any[] => Array.isArray(value)
export const isNil = (value: any): value is undefined | null => value == null
export const isObject = (value: any): value is object => {
    const type = typeof value
    return value != null && (type === 'object' || type === 'function')
}

const baseExtend = (dst: any, objs: any[], deep: boolean) => {
    objs.forEach(obj => {
        if (!isObject(obj) && !isFunction(obj)) return;
        Object.entries(obj).forEach(([key, src]) => {
            if (deep && isObject(src)) {
                if (!isObject(dst[key])) dst[key] = isArray(src) ? [] : {};
                baseExtend(dst[key], [src], true);
            } else {
                dst[key] = src;
            }
        })
    })

    return dst;
}

export const merge = (to: any, ...source: any[]): any => {
    return baseExtend(to, source, true)
}

export const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key as K))) as any
}

export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    return Object.fromEntries(keys.map(k => [k, obj[k]])) as any
}

export const debounce = <T>(fn: (...args: T[]) => void, wait: number = 0) => {
    let timerId: number | undefined

    return function (this: any, ...args: T[]) {
        clearTimeout(timerId)
        timerId = setTimeout(() => fn.call(this, ...args), wait)
    }
}

export const throttle = <T>(fn: (...args: T[]) => void, threshold: number) => {
    let timerId: number | undefined
    let lastTime = 0

    return function (this: any, ...args: T[]) {
        const currentTime = +new Date();
        clearTimeout(timerId)
        if (currentTime - lastTime < threshold) {
            timerId = setTimeout(() => fn.call(this, ...args), threshold)
        } else {
            lastTime = currentTime
            fn.call(this, ...args)
        }
    }
}

export const escapeStringLiteral = (string: string) => {
    return string.replace(/["'\\\n\r\u2028\u2029]/g, character => {
        // Escape all characters not included in SingleStringCharacters and
        // DoubleStringCharacters on
        // http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
        switch (character) {
            case '"':
            case "'":
            case '\\':
                return '\\' + character
            // Four possible LineTerminator characters need to be escaped:
            case '\n':
                return '\\n'
            case '\r':
                return '\\r'
            case '\u2028':
                return '\\u2028'
            case '\u2029':
                return '\\u2029'
        }

        // Can never reach here, just to make the TS typer happy.
        return character;
    })
}
