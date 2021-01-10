import Vue from 'vue'
import { AsyncComponentPromise } from 'vue/types/options'
import { Component, Model, Prop, Watch } from 'vue-property-decorator'
import EasyMde from 'vue-easymde'
import 'easymde/dist/easymde.min.css'
import type CodeMirror from 'codemirror'
import type { RoseliaMonacoEditor } from './roselia-monaco-post-editor'
import { IRoseliaEditPageActionBus, imageSourceForUrl } from './editor-actions'
import LoadingComponent from './editor-loading.vue'
import { handleBeforeChange, handleDrop, handlePaste, IImageUploader, IPasteHandler } from '../handle-paste'

declare global {
    namespace CodeMirror {
        interface Editor {
            on<K extends keyof HTMLElementEventMap>(event: K, handler: (instance: Editor, event: HTMLElementEventMap[K]) => void): void
        }
    }
}

export interface ISelectionItem {
    text?: string | number | object
    value?: string | number | object
    disabled?: boolean
    divider?: boolean
    header?: string
}

const RoseliaAsyncMonacoEditor: Vue.AsyncComponent = () => ({
    // Type fits only when component is an async function returns a promise, \
    // but Vue refuse to work in this occasion,
    // so we just make an assertion to make TS happy.
    component: import(/* webpackChunkName: "unions-road" */ './roselia-monaco-post-editor')
        .then(x => x.RoseliaMonacoEditor) as unknown as AsyncComponentPromise,
    loading: LoadingComponent
})


@Component({
    components: {
        RoseliaAsyncMonacoEditor: RoseliaAsyncMonacoEditor,
        EasyMde
    }
})
export class EditorSwitcher extends Vue {
    @Model('setValue') @Prop() value!: string
    @Prop() editor!: string
    @Prop() useMarkdown!: boolean
    @Prop() dark!: boolean
    @Prop({ default: false }) pasteHtml!: boolean
    @Prop({ default: () => {} }) postPageActionBus!: IRoseliaEditPageActionBus

    public static availableEditors: ISelectionItem[] = [
        { text: 'Easy Markdown Editor', value: 'easymde' },
        { text: 'Monaco Editor', value: 'monaco' }
    ]
    public static defaultEditor = 'easymde';
    private static easyMdeConfig = {
        spellChecker: false,
        hideIcons: ['guide']
    }

    private imageSourceForUrl(url: string, alt: string = '') {
        return imageSourceForUrl(this.useMarkdown, url, alt)
    }

    private get useMonaco() {
        return this.editor === 'monaco'
    }

    @Watch('editor') async onEditorChanged() {
        await this.$nextTick();
        this.setupEditor()
    }

    private handleChange(value: string) {
        this.$emit('setValue', value)
    }

    private setupMonaco() {
        const editor = this.$refs.editor as RoseliaMonacoEditor | null
        editor?.setup(this.postPageActionBus)
    }

    private setupSimpleMDE() {
        const editor = (this.$refs.editor as any).easymde.codemirror as CodeMirror.Editor

        const imageFormatHandler = (source: string) => {
            if (this.useMarkdown) return source;
            return source.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')
        }
        
        const pasteHandler: IPasteHandler = async (parts, additionalParts, input) => {
            console.log(this.pasteHtml, 'PM')
            if (this.pasteHtml) {
                input(imageFormatHandler((await additionalParts).join('')))
            } else {
                input(imageFormatHandler((await parts).join('')))
            }
        }
        const imageUploader: IImageUploader = (image, url) => {
            this.postPageActionBus.uploadImage?.(image, url).then(meta => {
                URL.revokeObjectURL(url)
                this.handleChange(this.value.replace(url, meta.url))
            })
        }

        editor.on('drop', (editor, event) => {
            handleDrop(editor, event, pasteHandler, imageUploader)
        })
        editor.on('paste', (editor: CodeMirror.Editor, event: ClipboardEvent) => {
            handlePaste(editor, event, pasteHandler, imageUploader)
        })
        editor.on('beforeChange', handleBeforeChange)
    }

    private setupEditor() {
        if (this.useMonaco) this.setupMonaco()
        else this.setupSimpleMDE()
    }

    public render() {
        if (this.useMonaco)
            return (
                <roselia-async-monaco-editor
                    value={this.value}
                    onInput={v => this.handleChange(v)}
                    useMarkdown={this.useMarkdown}
                    dark={this.dark}
                    ref="editor"
                    onLoaded={() => this.setupMonaco()}
                />
            )
        return (
            <easy-mde
                value={this.value}
                onInput={v => this.handleChange(v)}
                ref="editor"
                configs={EditorSwitcher.easyMdeConfig}
            />
        )
    }

    public mounted() {
        this.setupEditor()
    }
}