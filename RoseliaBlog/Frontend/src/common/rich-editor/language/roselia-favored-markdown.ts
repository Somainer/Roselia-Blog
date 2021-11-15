import * as monaco from 'monaco-editor'
import { RoseliaScript } from '@/common/roselia-script/index'
import { splitStringContentToFragment } from '@/common/roselia-script/compiler'
import { getJSWorker, completionEntryConverter, RichCompletionItem, aggregateDisplayParts, QuickInfoAdapter, SignatureHelpAdapter } from './language-service'
import declarations from '!!raw-loader!./essentials.d.ts'

/* eslint-disable no-useless-escape */

export const RFMLanguageId = 'roselia-post'

monaco.languages.register({
    id: RFMLanguageId
})

monaco.languages.setMonarchTokensProvider(RFMLanguageId, <monaco.languages.IMonarchLanguage> {
    defaultToken: '',
    tokenPostfix: '.roselia',

    // escape codes
    control: /[\\`*_\[\]{}()#+\-\.!]/,
    noncontrol: /[^\\`*_\[\]{}()#+\-\.!]/,
    escapes: /\\(?:@control)/,

    // escape codes for javascript/CSS strings
    jsescapes: /\\(?:[btnfr\\"']|[0-7][0-7]?|[0-3][0-7]{2})/,

    // non matched elements
    empty: [
        'area', 'base', 'basefont', 'br', 'col', 'frame',
        'hr', 'img', 'input', 'isindex', 'link', 'meta', 'param'
    ],

    tokenizer: {
        root: [
            [/^(---[\S]+[^$]+)/, 'comment.content'],
            // Roselia-Script
            [/((r|R|roselia|Roselia){{)/, {
                token: 'tag',
                next: 'roseliaScript',
                nextEmbedded: 'text/javascript'
            }],
            // headers (with #)
            [/^(\s{0,3})(#+)((?:[^\\#]|@escapes)+)((?:#+)?)/, ['white', 'keyword', 'keyword', 'keyword']],

            // headers (with =)
            [/^\s*(=+|\-+)\s*$/, 'keyword'],

            // headers (with ***)
            [/^\s*((\*[ ]?)+)\s*$/, 'meta.separator'],

            // quote
            [/^\s*>+/, 'comment'],

            // list (starting with * or number)
            [/^\s*([\*\-+:]|\d+\.)\s/, 'keyword'],

            // code block (4 spaces indent)
            [/^(\t|[ ]{4})[^ ].*$/, 'string'],

            // code block (3 tilde)
            [/^\s*~~~\s*((?:\w|[\/\-#])+)?\s*$/, { token: 'string', next: '@codeblock' }],

            // github style code blocks (with backticks and language)
            [/^\s*```\s*((?:\w|[\/\-#])+)\s*$/, { token: 'string', next: '@codeblockgh', nextEmbedded: '$1' }],

            // github style code blocks (with backticks but no language)
            [/^\s*```\s*$/, { token: 'string', next: '@codeblock' }],

            // markup within lines
            { include: '@linecontent' },
        ],

        roseliaScript: [
            [/}}/, { token: 'tag', next: '@pop', nextEmbedded: '@pop' }],
            [/(?!}})/, ''],
        ],

        codeblock: [
            [/^\s*~~~\s*$/, { token: 'string', next: '@pop' }],
            [/^\s*```\s*$/, { token: 'string', next: '@pop' }],
            [/.*$/, 'variable.source'],
        ],

        // github style code blocks
        codeblockgh: [
            [/```\s*$/, { token: 'variable.source', next: '@pop', nextEmbedded: '@pop' }],
            [/[^`]+/, 'variable.source'],
        ],

        linecontent: [

            // escapes
            [/&\w+;/, 'string.escape'],
            [/@escapes/, 'escape'],

            // various markup
            [/\b__([^\\_]|@escapes|_(?!_))+__\b/, 'strong'],
            [/\*\*([^\\*]|@escapes|\*(?!\*))+\*\*/, 'strong'],
            [/\b_[^_]+_\b/, 'emphasis'],
            [/\*([^\\*]|@escapes)+\*/, 'emphasis'],
            [/`([^\\`]|@escapes)+`/, 'variable'],

            // links
            [/\{+[^}]+\}+/, 'string.target'],
            [/(!?\[)((?:[^\]\\]|@escapes)*)(\]\([^\)]+\))/, ['string.link', '', 'string.link']],
            [/(!?\[)((?:[^\]\\]|@escapes)*)(\])/, 'string.link'],

            // or html
            { include: 'html' },
        ],

        // Note: it is tempting to rather switch to the real HTML mode instead of building our own here
        // but currently there is a limitation in Monarch that prevents us from doing it: The opening
        // '<' would start the HTML mode, however there is no way to jump 1 character back to let the
        // HTML mode also tokenize the opening angle bracket. Thus, even though we could jump to HTML,
        // we cannot correctly tokenize it in that mode yet.
        html: [
            // html tags
            [/<(\w+)\/>/, 'tag'],
            [/<(\w+)/, {
                cases: {
                    '@empty': { token: 'tag', next: '@tag.$1' },
                    '@default': { token: 'tag', next: '@tag.$1' }
                }
            }],
            [/<\/(\w+)\s*>/, { token: 'tag' }],

            [/<!--/, 'comment', '@comment']
        ],

        comment: [
            [/[^<\-]+/, 'comment.content'],
            [/-->/, 'comment', '@pop'],
            [/<!--/, 'comment.content.invalid'],
            [/[<\-]/, 'comment.content']
        ],

        // Almost full HTML tag matching, complete with embedded scripts & styles
        tag: [
            [/[ \t\r\n]+/, 'white'],
            [/(type)(\s*=\s*)(")([^"]+)(")/, [{ token: 'attribute.name.html' }, { token: 'delimiter.html' }, { token: 'string.html' },
                { token: 'string.html' , switchTo: '@tag.$S2.$4' },
                { token: 'string.html' }]],
            [/(type)(\s*=\s*)(')([^']+)(')/, [{ token: 'attribute.name.html' }, { token: 'delimiter.html' }, { token: 'string.html' },
                { token: 'string.html', switchTo: '@tag.$S2.$4' },
                { token: 'string.html' }]],
            [/(\w+)(\s*=\s*)("[^"]*"|'[^']*')/, ['attribute.name.html', 'delimiter.html', 'string.html']],
            [/\w+/, 'attribute.name.html'],
            [/\/>/, 'tag', '@pop'],
            [/>/, {
                cases: {
                    '$S2==style': { token: 'tag', switchTo: 'embeddedStyle', nextEmbedded: 'text/css' },
                    '$S2==script': {
                        cases: {
                            '$S3': { token: 'tag', switchTo: 'embeddedScript', nextEmbedded: '$S3' },
                            '@default': { token: 'tag', switchTo: 'embeddedScript', nextEmbedded: 'text/javascript' }
                        }
                    },
                    '@default': { token: 'tag', next: '@pop' }
                }
            }],
        ],

        embeddedStyle: [
            [/[^<]+/, ''],
            [/<\/style\s*>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
            [/</, '']
        ],

        embeddedScript: [
            [/[^<]+/, ''],
            [/<\/script\s*>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
            [/</, '']
        ],
    }
})

monaco.languages.setLanguageConfiguration(RFMLanguageId, {
    comments: {
        blockComment: ['<!--', '-->',]
    },
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
    ],
    autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '<', close: '>', notIn: ['string'] }
    ],
    surroundingPairs: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: '`', close: '`' },
    ],
    folding: {
        markers: {
            start: new RegExp("^\\s*<!--\\s*#?region\\b.*-->"),
            end: new RegExp("^\\s*<!--\\s*#?endregion\\b.*-->")
        }
    }
})

function* iterAllMatches(content: string, regex: RegExp) {
    let m: RegExpExecArray | null;
    while ((m = regex.exec(content)) !== null) {
        if (m.index === regex.lastIndex) {
            ++regex.lastIndex
        }

        yield m
    }
}

const getGlobalDefinitionClauses = (content: string) => {
    const fragments = splitStringContentToFragment(content).filter(v => v.type === 'roselia').map(x => x.value)
    const extractHelper = 'declare function _ext<T>(params: T | (() => T)): T;';
    const codes = fragments.flatMap(x => {
        return [...iterAllMatches(x, /(\w+)\(([\s\S]+),\s*([\s\S]+)\)/g)].flatMap(([_, fnName, symbol, body]) => {
            if (fnName.startsWith('def')) {
                const left = symbol.replace(/'/g, '').replace(/"/g, '')
                const right = fnName === 'defState' ? `_ext(${body})` : body
                const modifier = fnName === 'defState' ? 'let' : 'const'

                return [`${modifier} ${left} = ${right};`]
            }
            return []
        })
    })

    return `${extractHelper}\n${codes.join('')}`
}

const generateFakeArrayType = <T>(arr: T[]) => {
    if (arr.length) {
        return `${generateFakeObjectType(arr[0])}[]`
    }
    return 'any[]'
}
const generateFakeObjectType = <T>(obj: T) => {
    if (obj === null) return 'null'
    const fieldsAndTypes = Object.getOwnPropertyNames(obj).map(key => {
        const value = obj[key]

        if (Array.isArray(value)) {
            return `${key}: ${generateFakeArrayType(value)}`
        }
        if (typeof value === 'object') {
            return `${key}: ${generateFakeObjectType(value)}`
        }
        if (typeof value === 'function') {
            return `${key}(${[...Array(value.length)].map((_, i) => `arg${i}: any`).join(', ')}): any`
        }

        return `${key}: ${typeof value}`
    }).join('; ')

    return `{${fieldsAndTypes}}`
}

const inferTypeString = (obj: any) => {
    if (Array.isArray(obj)) return generateFakeArrayType(obj)
    if (typeof obj === 'object') return generateFakeObjectType(obj)
    return typeof obj
}

const generateFakeTypeScriptSourceOnObject = <T extends object>(obj: T, filter: (s: string) => boolean = () => true): string => {
    return Object.getOwnPropertyNames(obj).filter(filter).map(key => {
        const value = obj[key]
        const type = typeof value
        if (type === 'function') {
            const argString = [...Array(value.length)].map((_, i) => `arg${i}: any`).join(', ')
            return `declare function ${key}(${argString}): any;`
        }

        return `declare var ${key}: ${inferTypeString(value)};`
    }).join('\n')
}

monaco.languages.typescript.javascriptDefaults.addExtraLib(declarations, 'essentials.d.ts')
monaco.languages.typescript.javascriptDefaults.addExtraLib(generateFakeTypeScriptSourceOnObject(RoseliaScript.prototype, key => {
    return !['def', 'defState', 'useState', 'useMemo', 'useRef', 'useReactiveState', 'changeExtraDisplaySettings', 'createElement', '$createElement', 'hyperScript'].includes(key) // Which will be declared later.
}), 'roselia-script.d.ts')
monaco.languages.typescript.javascriptDefaults.addExtraLib(generateFakeTypeScriptSourceOnObject(new RoseliaScript(new Proxy({} as any, {
    get() { return () => {} }
})), key => {
    return !key.startsWith('_') && key !== 'app' && !(key in window) && key !== 'hyperScript'
}), 'roselia-dynamic.d.ts')


let lastModel: monaco.editor.IModel | undefined = undefined
const refreshModelByContent = (content: string) => {
    const globalDefs = getGlobalDefinitionClauses(content)
    lastModel?.dispose()
    lastModel = monaco.editor.createModel(globalDefs, 'typescript');
    return lastModel
}

const attachDetailResolver = (model: monaco.editor.IModel, position: monaco.Position, item: RichCompletionItem) => { 
    if (model.isDisposed()) return item;
    item.resolveMissingDetails = async () => {
        const worker = await getJSWorker(model.uri)
        const details = await worker.getCompletionEntryDetails(model.uri.toString(), model.getOffsetAt(position), item.label as string)
        if (!details) return {}
        return {
            detail: aggregateDisplayParts(details.displayParts),
            documentation: {
                value: aggregateDisplayParts(details.documentation)
            }
        }
    }

    return item;
}

monaco.languages.registerCompletionItemProvider(RFMLanguageId, {
    triggerCharacters: ['.', "'", '"'],
    async provideCompletionItems(model, position, _context) {
        const textUntilPosition = model.getValueInRange({startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column});
        const match = textUntilPosition.match(/(?:r|R|roselia|Roselia){{(([\s\S](?!}}))+)$/);
        if (!match) {
            return { suggestions: [] };
        }

        const word = model.getWordUntilPosition(position);
        const range: monaco.IRange = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
        };
        const defsModel = refreshModelByContent(model.getValue())
        const worker = await getJSWorker(defsModel.uri, model.uri)
        const suggestions = await worker.getCompletionsAtPosition(model.uri.toString(), model.getOffsetAt(position))
        return {
            suggestions: suggestions.entries
                .map(completionEntryConverter(model, range, position))
                .map(item => attachDetailResolver(model, position, item))
        }
        // return {
        //     suggestions: await provideRuntimeSuggestions(range, model.getValue(), toComplete)
        // }
    },
    async resolveCompletionItem(item, _token) {
        const completionItem = item as RichCompletionItem;
        const detail = await completionItem.resolveMissingDetails?.() || {}

        return <RichCompletionItem> {
            ...item,
            ...detail
        }
    }
})
monaco.languages.registerHoverProvider(RFMLanguageId, new QuickInfoAdapter(getJSWorker))
monaco.languages.registerSignatureHelpProvider(RFMLanguageId, {
    signatureHelpTriggerCharacters: ['(', ','],
    provideSignatureHelp(model, position, token, context) {
        const adapter: monaco.languages.SignatureHelpProvider = new SignatureHelpAdapter((...uris: monaco.Uri[]) => {
            return getJSWorker(refreshModelByContent(model.getValue()).uri, ...uris)
        })
        return adapter.provideSignatureHelp(model, position, token, context)
    }
})
