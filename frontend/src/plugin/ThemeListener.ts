import { defineComponent, h, onBeforeUnmount, onMounted } from 'vue'

export default defineComponent({
  name: 'ThemeListener',
  props: {
    modelValue: { type: Boolean, default: undefined }
  },
  emits: ['update:modelValue'],
  setup(_props, { emit }) {
    const setState = (s?: boolean) => emit('update:modelValue', s)
    let disposers: Array<() => void> = []

    const checkScheme = () => {
      const prefersDark = matchMedia('(prefers-color-scheme: dark)')
      const prefersLight = matchMedia('(prefers-color-scheme: light)')
      if (prefersDark.matches || prefersLight.matches) {
        setState(prefersLight.matches)
        const onDark = (m: MediaQueryListEvent) => setState(!m.matches)
        const onLight = (m: MediaQueryListEvent) => setState(m.matches)
        prefersDark.addEventListener('change', onDark)
        prefersLight.addEventListener('change', onLight)
        disposers.push(() => {
          prefersDark.removeEventListener('change', onDark)
          prefersLight.removeEventListener('change', onLight)
        })
      } else {
        setState(undefined)
      }
    }

    onMounted(checkScheme)
    onBeforeUnmount(() => { disposers.forEach(d => d()); disposers = [] })

    return () => h('div', { style: 'display:none' })
  }
})
