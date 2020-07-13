
import { getJavaScriptWorker } from 'monaco-editor/esm/vs/language/typescript/tsMode'
import { SuggestAdapter } from 'monaco-editor/esm/vs/language/typescript/languageFeatures'
export { SuggestAdapter };
export { FormatAdapter, QuickInfoAdapter, SignatureHelpAdapter } from 'monaco-editor/esm/vs/language/typescript/languageFeatures'
import * as monaco from 'monaco-editor'


export const getJSWorker = async (...uri: monaco.Uri[]): Promise<monaco.languages.typescript.TypeScriptWorker> => {
    const getter = await getJavaScriptWorker()
    return await getter(...uri)
}

export interface RichCompletionItem extends monaco.languages.CompletionItem {
    label: string;
    uri: monaco.Uri;
    position: monaco.Position;
}

export const convertItemKind = (kind: string): monaco.languages.CompletionItemKind => 
    SuggestAdapter.convertKind(kind)

export const completionEntryConverter = (model: monaco.editor.IModel, wordRange: monaco.IRange, position: monaco.Position) => (entry: any): monaco.languages.CompletionItem => {
    let range = wordRange;
    if (entry.replacementSpan) {
        const p1 = model.getPositionAt(entry.replacementSpan.start);
        const p2 = model.getPositionAt(entry.replacementSpan.start + entry.replacementSpan.length);
        range = new monaco.Range(p1.lineNumber, p1.column, p2.lineNumber, p2.column);
    }

    return {
        uri: model.uri,
        position,
        range: range,
        label: entry.name,
        insertText: entry.name,
        sortText: entry.sortText,
        kind: convertItemKind(entry.kind)
    } as RichCompletionItem;
}

export const aggregateDisplayParts = (displayParts: { text: string }[] | undefined) => {
    if (displayParts) {
        return displayParts.map(dp => dp.text).join('')
    }

    return ''
}