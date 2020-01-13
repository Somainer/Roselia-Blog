import _ from 'lodash'


const getTag = (value: any) => {
    if (value == null) {
        return value === undefined ? '[object Undefined]' : '[object Null]'
    }
    return [].toString.call(value)
}

const isObjectLike = (value: any): boolean => typeof value === 'object' && value !== null
export const isNumber = (value: any): value is number => typeof value === 'number' || (isObjectLike(value) && getTag(value) == '[object Number]')
export const isFunction = (value: any): value is (...args: any[]) => any => typeof value === 'function'
export const isString = (value: any): value is string => {
    const type = typeof value
    return type === 'string' || (type === 'object' && value != null && !Array.isArray(value) && getTag(value) == '[object String]')
}
export const isArray = (value: any): value is any[] => Array.isArray(value)
export const isNil = (value: any): value is undefined | null => value == null
export const isObject = (value: any): value is object => {
    const type = typeof value
    return value != null && (type === 'object' || type === 'function')
}

const baseExtend = (dst: any, objs: any[], deep: boolean) => {
    for (var i = 0, ii = objs.length; i < ii; ++i) {
        var obj = objs[i];
        if (!isObject(obj) && !isFunction(obj)) continue;
        var keys = Object.keys(obj);
        for (var j = 0, jj = keys.length; j < jj; j++) {
            var key = keys[j];
            var src = obj[key];
            if (deep && isObject(src)) {
                if (!isObject(dst[key])) dst[key] = isArray(src) ? [] : {};
                baseExtend(dst[key], [src], true);
            } else {
                dst[key] = src;
            }
        }
    }

    return dst;
}

export const merge = (to: any, ...source: any[]): any => {
    return baseExtend(to, source, true)
}

export const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    return Object.fromEntries(Object.entries(obj).filter(([key]) => keys.indexOf(key as K) === -1)) as any
}
