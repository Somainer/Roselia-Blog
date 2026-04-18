import { defineComponent, getCurrentInstance } from 'vue'

const noop = () => {}

export default defineComponent({
  name: 'CustomDialog',
  props: {
    onConfirm: { type: Function as any, default: noop },
    onReject: { type: Function as any, default: noop },
    cleanUp: { type: Function as any, default: undefined },
    title: { type: String, default: '' },
    message: { type: String, default: '' }
  },
  data() {
    return {
      dialog: true,
      isConfirmed: false
    }
  },
  watch: {
    dialog(newVal: boolean, _oldVal: boolean) {
      if (!newVal) {
        if (!this.isConfirmed) (this as any).onReject()
        const instance = getCurrentInstance()
        if (instance && instance.proxy) {
          // The parent-mounted dialog manages teardown via the cleanUp callback.
        }
        ;(this as any).cleanUp && (this as any).cleanUp()
      }
    }
  },
  methods: {
    commitConfirm() {
      this.isConfirmed = true
      ;(this as any).onConfirm()
      this.dialog = false
    },
    commitReject() {
      this.isConfirmed = false
      ;(this as any).onReject()
      this.dialog = false
    }
  }
})
