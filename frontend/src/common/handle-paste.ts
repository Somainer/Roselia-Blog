import CodeMirror from 'codemirror'

type IPasteHandler = (parts: Promise<string[]>, additionalParts: Promise<string[]>, input: (s: string) => void) => void
type IImageUploader = (image: File, origionalUrl: string) => void;
    
const handleFileTransfer = async (instance: CodeMirror.Editor, items?: DataTransferItemList, handler?: IPasteHandler, uploader?: IImageUploader) => {
    if (!items) return;
    let parts: Promise<string>[] = []
    const additionalParts: Promise<string>[] = []
    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file' && item.type.startsWith('image/')) {
            const image = item.getAsFile()!
            const url = URL.createObjectURL(image)
            const imagePromise = Promise.resolve(`![](${url})`)
            parts.push(imagePromise)
            additionalParts.push(imagePromise)
            uploader && uploader(image, url)
        } else if (item.kind === 'string' && item.type === 'vscode-editor-data') {
            const metaData: string = await new Promise(resolve => item.getAsString(resolve))
            const parsed = JSON.parse(metaData)
            if (parsed.mode && !['markdown', 'html'].includes(parsed.mode.toLowerCase())) {
                const text = parts[0]
                parts = [text.then(x => `\`\`\`${parsed.mode}\n${x}\n\`\`\``)]
            }
        } else if (i === 0) {
            parts.push(new Promise(resolve => item.getAsString(resolve)))
        } else if (item.type === 'text/html') {
            additionalParts.push(new Promise(resolve => item.getAsString(resolve)))
        }
    }
    if (handler) {
        if (!additionalParts.length) additionalParts.push(parts[0]);
        handler(Promise.all(parts), Promise.all(additionalParts), s => instance.replaceSelection(s))
    } else {
        const resolvedParts = await Promise.all(parts)
        instance.replaceSelection(resolvedParts.join(''))
    }
}

export const handlePaste = async (instance: CodeMirror.Editor, event: ClipboardEvent, handler?: IPasteHandler, uploader?: IImageUploader) => {
    const items = event.clipboardData?.items;
    event.preventDefault()
    handleFileTransfer(instance, items, handler, uploader)
}

export const handleDrop = async (instance: CodeMirror.Editor, event: DragEvent, handler?: IPasteHandler, uploader?: IImageUploader) => {
    const items = event.dataTransfer?.items
    event.preventDefault()
    handleFileTransfer(instance, items, handler, uploader)
}

export const handleBeforeChange = (instance: CodeMirror.Editor, changes: CodeMirror.EditorChangeCancellable) => {
    if (changes.origin === 'paste') changes.cancel()
}