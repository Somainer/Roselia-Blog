import { defineComponent, ref, h } from 'vue'
import * as monaco from 'monaco-editor'
import { MonacoWrapper } from './monaco-wrapper'
import { IRoseliaEditPageActionBus, imageSourceForUrl } from './editor-actions'
import { RFMLanguageId } from './language/roselia-favored-markdown'

const MonacoConfigs: monaco.editor.IStandaloneEditorConstructionOptions = {
  tabSize: 2,
  wordWrap: 'on'
}
const CommandPrefix: string = 'Roselia-Blog'

export const RoseliaMonacoEditor = defineComponent({
  name: 'roselia-monaco-editor',
  components: { MonacoWrapper },
  props: {
    modelValue: { type: String, default: '' },
    useMarkdown: { type: Boolean, default: false },
    dark: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'loaded'],
  setup(props, { emit, expose }) {
    const editorRef = ref<any>(null)
    let isInitialized = false

    const imageSourceForUrlLocal = (url: string, alt: string = '') => imageSourceForUrl(props.useMarkdown, url, alt)

    const setup = (actionBus: IRoseliaEditPageActionBus) => {
      if (isInitialized) return
      const editor: monaco.editor.IStandaloneCodeEditor = editorRef.value?.editor
      if (!editor) return

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        actionBus.save?.(false)
      })
      editor.addAction({
        id: 'save-and-leave',
        label: `${CommandPrefix}: Save Changes and Leave`,
        run() { actionBus.save?.(true) }
      })

      if (actionBus.goToPreview) {
        editor.addAction({
          id: 'go-to-preview',
          label: `${CommandPrefix}: Preview This Post`,
          run() { actionBus.goToPreview?.() }
        })
      }

      if (actionBus.goToLivePreview) {
        editor.addAction({
          id: 'go-to-live-preview',
          label: `${CommandPrefix}: Live Preview This Post`,
          run() { actionBus.goToLivePreview?.() }
        })
      }

      editor.addAction({
        id: 'switch-roselia-dom',
        label: `${CommandPrefix}: Switch Roselia-Dom`,
        run(editor) {
          const model = editor.getModel()
          if (!model) return
          const firstLine = model.getLineContent(1)
          if (firstLine.startsWith('---feature:roselia-dom')) {
            model.pushEditOperations([], [{ range: new monaco.Range(1, 1, 2, 0), text: '' }], () => null)
          } else {
            model.pushEditOperations([], [{ range: new monaco.Range(1, 0, 1, 0), text: '---feature:roselia-dom---\n' }], () => null)
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
            const imageSource = imageSourceForUrlLocal(url)
            const selection = editor.getSelection()!
            editor.executeEdits('', [{ range: monaco.Range.lift(selection), text: imageSource }])
            actionBus.uploadImage?.(image, url).then(meta => {
              URL.revokeObjectURL(url)
              const newUrl = meta.url
              editor.getModel()?.findMatches(url, true, false, true, null, false).forEach(({ range }) => {
                editor.executeEdits('', [{ range, text: newUrl }])
              })
            })
          }
        }
      }
      editor.getDomNode()?.addEventListener('paste', eventListener)
      isInitialized = true
    }

    expose({
      setup,
      get editor() {
        return editorRef.value?.editor
      }
    })

    const handleChange = (value: string) => emit('update:modelValue', value)

    return () => h(MonacoWrapper as any, {
      ref: editorRef,
      'model-value': props.modelValue,
      'onUpdate:modelValue': handleChange,
      language: props.useMarkdown ? RFMLanguageId : 'html',
      dark: props.dark,
      configs: MonacoConfigs,
      onVnodeMounted: () => emit('loaded')
    })
  }
})

export default RoseliaMonacoEditor
