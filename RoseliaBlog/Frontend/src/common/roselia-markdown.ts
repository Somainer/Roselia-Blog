import marked from 'marked'

(marked as any).use({
    tokenizer: {
        del(src: string) {
            const match = src.match(/^~((?:~~|[^~])+?)~(?!~)/);
            if (match) {
                return {
                    type: 'text',
                    raw: match[0],
                    text: `<span class="heimu">${match[1]}</span>`
                };
            }
            return false;
        },
        codespan(src: string) {
            const match = src.match(/^((?:r|R|Roselia|roselia){{[\s\S]+}})/)
            if (match) {
                return {
                    type: 'text',
                    raw: match[0],
                    text: match[0]
                }
            }

            const prefixMatch = src.match(/^([^rR])((?:r|R|Roselia|roselia){{[\s\S]+}})/)
            if (prefixMatch) {
                return {
                    type: 'text',
                    raw: prefixMatch[1],
                    text: prefixMatch[1]
                }
            }

            return false;
        }
    }
})

export const markdown = (text: string) => marked(text) 

export const markdownAsync = async (text: string): Promise<string> => {
    return new Promise(resolve => {
        marked(text, (_err, result) => resolve(result))
    })
}
