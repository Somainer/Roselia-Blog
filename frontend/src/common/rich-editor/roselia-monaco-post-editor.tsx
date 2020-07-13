import Vue from 'vue'
import { Component, Model, Prop } from 'vue-property-decorator'
import * as monaco from 'monaco-editor'
import { MonacoWrapper } from './monaco-wrapper'
import { IRoseliaEditPageActionBus, imageSourceForUrl } from './editor-actions'
import { RFMLanguageId } from './language/roselia-favored-markdown'

@Component({
    components: { MonacoWrapper }
})
export class RoseliaMonacoEditor extends Vue {
    @Model('input') @Prop() value!: string
    @Prop() useMarkdown!: boolean
    @Prop() dark!: boolean

    private static MonacoConfigs: monaco.editor.IStandaloneEditorConstructionOptions = {
        tabSize: 2,
        wordWrap: 'on'
    }
    public static CommandPrefix: string = 'Roselia-Blog'

    private handleChange(value: string) {
        this.$emit('input', value)
    }

    private imageSourceForUrl(url: string, alt: string = '') {
        return imageSourceForUrl(this.useMarkdown, url, alt)
    }

    private isInitialized: boolean = false

    public get editor() {
        return (this.$refs.editor as MonacoWrapper).editor;
    }

    public setup(actionBus: IRoseliaEditPageActionBus) {
        if (this.isInitialized) return;

        const editor = this.editor
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
            actionBus.save?.()
        })

        if (actionBus.goToPreview) {
            editor.addAction({
                id: 'go-to-preview',
                label: `${RoseliaMonacoEditor.CommandPrefix}: Preview This Post`,
                run() {
                    actionBus.goToPreview?.()
                }
            })
        }

        if (actionBus.goToLivePreview) {
            editor.addAction({
                id: 'go-to-live-preview',
                label: `${RoseliaMonacoEditor.CommandPrefix}: Live Preview This Post`,
                run() {
                    actionBus.goToLivePreview?.()
                }
            })
        }

        editor.addAction({
            id: 'switch-roselia-dom',
            label: `${RoseliaMonacoEditor.CommandPrefix}: Switch Roselia-Dom`,
            run (editor) {
                const model = editor.getModel()
                if (!model) return;
                const firstLine = model.getLineContent(1)
                if (firstLine.startsWith('---feature:roselia-dom')) {
                    model.pushEditOperations([], [
                        {
                            range: new monaco.Range(1, 1, 2, 0),
                            text: ''
                        }
                    ], () => null)
                } else {
                    model.pushEditOperations([], [
                        {
                            range: new monaco.Range(1, 0, 1, 0),
                            text: '---feature:roselia-dom---\n'
                        }
                    ], () => null)
                    // this.handleChange(['---feature:roselia-dom---', firstLine, ...lines].join('\n'))
                }
            }
        })

        const eventListener = (event: ClipboardEvent) => {
            const items = event.clipboardData?.items || []
            for (let i = 0; i < items.length; ++i) {
                const item = items[i]
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const image = item.getAsFile()!
                    const url = URL.createObjectURL(image)
                    const imageSource = this.imageSourceForUrl(url)
                    const selection = editor.getSelection()!
                    editor.executeEdits('', [
                        {
                            range: monaco.Range.lift(selection),
                            text: imageSource
                        }
                    ])
                    actionBus.uploadImage?.(image, url).then(meta => {
                        URL.revokeObjectURL(url)
                        const newUrl = meta.url
                        editor.getModel()?.findMatches(url, true, false, true, null, false).forEach(({ range }) => {
                            editor.executeEdits('', [
                                {
                                    range,
                                    text: newUrl
                                }
                            ])
                        })
                    })
                }
            }
        }
        editor.getDomNode()?.addEventListener('paste', eventListener)
        this.isInitialized = true;
    }

    public render() {
        return (
            <monaco-wrapper
                value={this.value}
                onInput={v => this.handleChange(v)}
                language={this.useMarkdown ? RFMLanguageId : 'html'}
                dark={this.dark}
                ref="editor"
                configs={ RoseliaMonacoEditor.MonacoConfigs }
            ></monaco-wrapper>
        )
    }

    public mounted() {
        this.$emit('loaded')
    }
}
