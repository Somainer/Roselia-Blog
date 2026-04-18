import { defineComponent, onMounted, onBeforeUnmount, ref, watch, type PropType, h } from 'vue'
import * as Monaco from 'monaco-editor'

export const MonacoWrapper = defineComponent({
  name: 'monaco-wrapper',
  props: {
    modelValue: { type: String, default: '' },
    language: { type: String, default: 'plaintext' },
    readOnly: { type: Boolean, default: false },
    dark: { type: Boolean, default: false },
    configs: { type: Object as PropType<Monaco.editor.IStandaloneEditorConstructionOptions>, default: () => ({}) }
  },
  emits: ['update:modelValue'],
  setup(props, { emit, expose }) {
    const container = ref<HTMLElement | null>(null)
    let editor: Monaco.editor.IStandaloneCodeEditor | undefined
    let prevHeight = 0

    const fitEditorHeight = () => {
      if (!editor) return
      const editorElement = editor.getDomNode()
      if (!editorElement) return
      const lineHeight = editor.getOption(Monaco.editor.EditorOption.lineHeight)
      const lineCount = editor.getModel()?.getLineCount() || 1
      const computedHeight = editor.getTopForLineNumber(lineCount + 1) + lineHeight
      const height = Math.min(computedHeight, screen.availHeight * 0.9)
      if (prevHeight !== height) {
        prevHeight = height
        editorElement.style.height = `${height}px`
        editor.layout()
      }
    }

    watch(() => props.modelValue, (newValue: string) => {
      if (editor && editor.getValue() != newValue) editor.setValue(newValue)
    })
    watch(() => props.language, () => {
      if (editor) Monaco.editor.setModelLanguage(editor.getModel()!, props.language)
    })
    watch(() => props.dark, () => {
      Monaco.editor.setTheme(props.dark ? 'vs-dark' : 'vs')
    }, { immediate: true })

    onMounted(() => {
      editor = Monaco.editor.create(container.value!, {
        value: props.modelValue,
        language: props.language,
        readOnly: props.readOnly,
        fontSize: 14,
        ...props.configs
      })
      editor.onDidChangeModelContent(ev => {
        const value = editor!.getValue()
        if (value != props.modelValue) emit('update:modelValue', value, ev as any)
      })
      editor.onDidChangeModelDecorations(() => {
        fitEditorHeight()
        requestAnimationFrame(() => fitEditorHeight())
      })
    })

    onBeforeUnmount(() => {
      editor && editor.dispose()
      editor = undefined
    })

    expose({
      get editor() {
        return editor
      }
    })

    return () => h('div', { ref: container, style: { minHeight: '40vh', maxHeight: '100vh' } })
  }
})

export default MonacoWrapper
