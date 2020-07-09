import * as _ from '@/common/fake-lodash'
import { RoseliaVNode, RoseliaText, RoseliaNativeVNode } from './vnode';
import { isTextNode, isElementNode } from './browser-dom';

interface StringContentFragment {
    type: 'string' | 'roselia'
    value: string
}

const isStringContentFragment = (value: any): value is StringContentFragment =>
    (typeof value === 'object') && _.isString(value.value) && _.isString(value.type)

interface RoseliaTemplateFragment {
    tag: string | object
    props: Record<string, StringContentFragment[] | string | object>
    children: (RoseliaTemplateFragment | StringContentFragment)[]
}

const stringToLiteral = (string: string) => `"${_.escapeStringLiteral(string)}"`
const fragmentToLiteral = (fragment: StringContentFragment) => {
    if (fragment.type === 'string') return stringToLiteral(fragment.value)
    return fragment.value
}

const splitStringContentToFragment = (fragments: string, delim?: [string, string]): StringContentFragment[] => {
    delim = delim  || ['(?:r|R|roselia|Roselia){{', '}}']
    const result = fragments.split(new RegExp(delim.join('\\s*?([\\s\\S]+?)\\s*?'), 'gm')).map((value, index) => {
        if (index & 1) {
            let code = value.trim();
            const singleArityLike = /^([a-zA-Z_$]+[a-zA-Z_0-9]*){([\s\S]+)}/.exec(code);
            if (singleArityLike) {
                const [_input, fn, ctx] = singleArityLike
                code = `${fn}(${stringToLiteral(ctx)})`
            }

            if (code.startsWith('//')) code = '';
            else if (code.endsWith(';')) code = `((${code.substring(0, code.length - 1)}), '')`

            return {
                type: 'roselia',
                value: code
            }
        }

        return {
            type: 'string',
            value
        }
    }).filter(x => !!x.value)
    if (result.length) return result as StringContentFragment[]
    return [
        {
            type: 'string',
            value: ''
        }
    ]
}

export const compileTemplateBody = (template: string): string => {
    const fragment = document.createElement('div')
    fragment.innerHTML = template;
    return emitFragmentToBody(elementToTemplateFragment(fragment));
}
export const compileTemplate = <T>(template: string): (t: T) => RoseliaVNode => {
    const skeleton = (body: string) => `
        with(this) { var __r=createElement; return (${body}); }
    `
    const body = compileTemplateBody(template);
    const func = new Function(skeleton(body));
    return x => func.call(x)
}

export function elementToTemplateFragment(element: Node): RoseliaTemplateFragment {
    if (isTextNode(element)) {
        return {
            tag: 'text',
            props: { textContent: splitStringContentToFragment(element.textContent || '') },
            children: []
        };
    }

    if (isElementNode(element)) {
        const propEntries = [...element.attributes].map(attribute => [attribute.name, attribute.value]).filter(([key, value]) => {
            if (!value) return false;
            if (key.startsWith('on')) return true;

            return _.isString(value)
        }).map(([key, value]) => {
            if (_.isString(value)) {
                const processedValue = splitStringContentToFragment(decodeURIComponent(value))
                if (key === 'class') return ['className', processedValue]
                else return [key, processedValue]
            }
            return [key, value]
        })

        const props = Object.fromEntries(propEntries)
        const children = [...element.childNodes].flatMap<RoseliaTemplateFragment | StringContentFragment>(child => {
            if (isTextNode(child)) {
                return splitStringContentToFragment(child.textContent || '')
            } else {
                return [elementToTemplateFragment(child)]
            }
        })

        return {
            tag: element.tagName.toLowerCase(),
            props,
            children
        }
    }

    return {
        tag: 'text',
        props: {
            textContent: element.textContent || ''
        },
        children: []
    };
}

const emitFragmentList = (fragments: StringContentFragment[]): string => {
    return `(${fragments.map(fragmentToLiteral).join('+')})`
}

const emitPropsObject = (props: Record<string, string | object | StringContentFragment[]>): string => {
    const entries = Object.entries(props).map(([key, value]) => {
        if (_.isString(value)) return [key, value]
        if (_.isArray(value)) return [key, emitFragmentList(value)]
        return [key, emitPropsObject(value as any)]
    })

    return `{${entries.map(x => x.join(': ')).join(', ')}}`
}

export function emitFragmentToBody(fragment: RoseliaTemplateFragment): string {
    if (fragment.tag === 'text') {
        const content = fragment.props.textContent
        if (_.isString(content)) return stringToLiteral(content)
        else if (_.isArray(content)) {
            if (content.length === 1) return stringToLiteral(content[0].value)
            else return `(${content.map(fragmentToLiteral).join('+')})`
        } else return ''
    }

    const props = emitPropsObject(fragment.props);
    const children = `[${fragment.children.map(value => {
        if (isStringContentFragment(value)) {
            if (value.type === 'string') return stringToLiteral(value.value)
            return `__r(function() { return (${value.value}); }, null, [])`
        }
        return emitFragmentToBody(value)
    }).join(', ')}]`;
    const shouldBeFunction = Object.values(fragment.props).some(x => _.isArray(x) && x.some(y => y.type !== 'string'))
    const elementCreater = `__r('${fragment.tag}', ${props}, ${children})`
    if (shouldBeFunction) return `__r(function() { return ${elementCreater} }, null, [])`
    return elementCreater
}
