import utils from "../utils";
import type { IInComechatMessage } from "./chat";

const END_TOKEN = "<|im_end|>"

export async function* askStream (text: string, history: IInComechatMessage[] = []) {
    const token = utils.getLoginData()?.token ?? ''
    history = history.map(({from, to, content}) => ({
        from, to, content
    }))
    
    const response = await fetch(utils.apiFor('chat', 'ask-stream'), {
        method: 'POST',
        body: JSON.stringify({text, history}),
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    
    const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader()
    let wholeText = '';
    while (true) {
        const { done, value } = await reader.read()
        if (done) break;
        wholeText += value || ''
        wholeText = wholeText.endsWith(END_TOKEN) ? wholeText.substring(0, wholeText.length - END_TOKEN.length) : wholeText
        yield wholeText
    }
}
