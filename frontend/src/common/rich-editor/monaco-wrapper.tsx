import Vue from 'vue'
import { Component, Model, Prop, Watch } from 'vue-property-decorator'
import * as Monaco from 'monaco-editor'

@Component({})
export class MonacoWrapper extends Vue {
    @Model('input') @Prop() value!: string
    @Prop() language!: string
    @Prop({ default: false }) readOnly!: boolean
    @Prop({ default: false }) dark!: boolean
    @Prop({ default: () => ({}) }) configs!: Monaco.editor.IStandaloneEditorConstructionOptions

    public editor!: Monaco.editor.IStandaloneCodeEditor
    
    @Watch('value') onValueChanged(newValue: string) {
        if (this.editor.getValue() != newValue) {
            this.editor.setValue(newValue)
        }
    }

    @Watch('language') onLanguageChanged() {
        Monaco.editor.setModelLanguage(this.editor.getModel()!, this.language)
    }

    @Watch('dark', { immediate: true }) onThemeChanged() {
        Monaco.editor.setTheme(this.dark ? 'vs-dark' : 'vs')
    }
    
    private prevHeight: number = 0
    private fitEditorHeight() {
        const { editor } = this
        const editorElement = editor.getDomNode()

        if (!editorElement) {
            return
        }

        const lineHeight = editor.getOption(Monaco.editor.EditorOption.lineHeight)
        const lineCount = editor.getModel()?.getLineCount() || 1
        const computedHeight = editor.getTopForLineNumber(lineCount + 1) + lineHeight
        const height = Math.min(computedHeight, screen.availHeight * 0.9)

        if (this.prevHeight !== height) {
            this.prevHeight = height
            editorElement.style.height = `${height}px`
            editor.layout()
        }
    }

    public mounted() {
        this.editor = Monaco.editor.create(this.$refs.container as HTMLElement, {
            value: this.value,
            language: this.language,
            readOnly: this.readOnly,
            fontSize: 14,
            ...this.configs
        });

        this.editor.onDidChangeModelContent(ev => {
            const value = this.editor.getValue()
            if (value != this.value) {
                this.$emit('input', value, ev)
            }
        })
        this.editor.onDidChangeModelDecorations(() => {
            this.fitEditorHeight()
            requestAnimationFrame(() => this.fitEditorHeight())
        })
    }
    public render() {
        return (<div ref="container" style={{minHeight: '40vh', maxHeight: '100vh'}}></div>)
    }

    public destroyed() {
        this.editor.dispose()
    }
}
