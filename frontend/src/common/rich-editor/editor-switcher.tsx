import { defineAsyncComponent, defineComponent, ref, watch, onMounted, nextTick, type PropType, h } from 'vue'
import type CodeMirror from 'codemirror'
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

const availableEditors: ISelectionItem[] = [
  { text: 'Easy Markdown Editor', value: 'easymde' },
  { text: 'Monaco Editor', value: 'monaco' }
]
const defaultEditor = 'easymde'
const easyMdeConfig = { spellChecker: false, hideIcons: ['guide'] }

const RoseliaAsyncMonacoEditor = defineAsyncComponent({
  loader: () => import('./roselia-monaco-post-editor').then(x => x.RoseliaMonacoEditor),
  loadingComponent: LoadingComponent as any
})

// Lazy-load vue-easymde if installed; otherwise fall back to a textarea.
const EasyMde = defineAsyncComponent({
  loader: async () => {
    try {
      const mod: any = await import('vue-easymde')
      await import('easymde/dist/easymde.min.css')
      return mod.default || mod
    } catch {
      return defineComponent({
        name: 'easymde-fallback',
        props: ['modelValue'],
        emits: ['update:modelValue'],
        setup(props, { emit }) {
          return () =>
            h('textarea', {
              style: 'width: 100%; min-height: 40vh;',
              value: props.modelValue,
              onInput: (e: any) => emit('update:modelValue', e.target.value)
            })
        }
      })
    }
  },
  loadingComponent: LoadingComponent as any
})

export const EditorSwitcher = defineComponent({
  name: 'editor-switcher',
  components: { RoseliaAsyncMonacoEditor, EasyMde },
  props: {
    modelValue: { type: String, default: '' },
    editor: { type: String, default: defaultEditor },
    useMarkdown: { type: Boolean, default: true },
    dark: { type: Boolean, default: false },
    pasteHtml: { type: Boolean, default: false },
    postPageActionBus: { type: Object as PropType<IRoseliaEditPageActionBus>, default: () => ({}) }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const editorRef = ref<any>(null)
    const useMonaco = () => props.editor === 'monaco'

    const handleChange = (value: string) => emit('update:modelValue', value)

    const imageSourceForUrlLocal = (url: string, alt: string = '') =>
      imageSourceForUrl(props.useMarkdown, url, alt)

    const setupMonaco = () => {
      const editor = editorRef.value
      editor?.setup?.(props.postPageActionBus)
    }

    const setupSimpleMDE = () => {
      const inner: any = editorRef.value
      if (!inner) return
      const editor: CodeMirror.Editor = inner.easymde?.codemirror
      if (!editor) return

      const imageFormatHandler = (source: string) => {
        if (props.useMarkdown) return source
        return source.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')
      }

      const pasteHandler: IPasteHandler = async (parts, additionalParts, input) => {
        if (props.pasteHtml) input(imageFormatHandler((await additionalParts).join('')))
        else input(imageFormatHandler((await parts).join('')))
      }
      const imageUploader: IImageUploader = (image, url) => {
        props.postPageActionBus.uploadImage?.(image, url).then(meta => {
          URL.revokeObjectURL(url)
          handleChange(props.modelValue.replace(url, meta.url))
        })
      }

      editor.on('drop', (e: any, event: any) => handleDrop(e, event, pasteHandler, imageUploader))
      editor.on('paste', (e: any, event: any) => handlePaste(e, event, pasteHandler, imageUploader))
      editor.on('beforeChange', handleBeforeChange as any)
    }

    const setupEditor = () => {
      if (useMonaco()) setupMonaco()
      else setupSimpleMDE()
    }

    watch(() => props.editor, async () => {
      await nextTick()
      setupEditor()
    })

    onMounted(() => setupEditor())

    return () => {
      if (useMonaco()) {
        return h(RoseliaAsyncMonacoEditor as any, {
          ref: editorRef,
          'model-value': props.modelValue,
          'onUpdate:modelValue': (v: string) => handleChange(v),
          useMarkdown: props.useMarkdown,
          dark: props.dark,
          onLoaded: () => setupMonaco()
        })
      }
      return h(EasyMde as any, {
        ref: editorRef,
        value: props.modelValue,
        'onUpdate:modelValue': (v: string) => handleChange(v),
        onInput: (v: string) => handleChange(v),
        modelValue: props.modelValue,
        configs: easyMdeConfig
      })
    }
  }
})

;(EditorSwitcher as any).availableEditors = availableEditors
;(EditorSwitcher as any).defaultEditor = defaultEditor

export default EditorSwitcher
