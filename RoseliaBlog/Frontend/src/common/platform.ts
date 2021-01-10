import {mapEntries, mapValues, tupleToDict} from "@/common/helpers";

const patterns = {
    ie: 'Trident',
    opera: 'Presto',
    webKit: 'AppleWebkit',
    fireFox: [
        'Gecko', 'KHTML'
    ],
    mobile: u => !!u.match(/AppleWebKit.*Mobile.*/),
    iOS: u => !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),
    android: ['Android', 'Adr'],
    iPhone: 'iPhone',
    iPad: 'iPad',
    weChat: 'MicroMessenger',
    macOS: 'Mac OS X'
}

const rawPlatform = mapValues(v => {
    const ua = navigator.userAgent
    const validator = predicate => {
        if(typeof predicate === "function") return predicate(ua)
        if(typeof predicate === 'string') return ua.indexOf(predicate) > -1
        if(Array.isArray(predicate)) return predicate.some(validator)
        return null
    }
    return validator(v)
})(patterns)

export const platform = {
    ...rawPlatform
}
