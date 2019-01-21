import { Component, Emit, Inject, Model, Prop, Provide, Watch, Vue } from 'vue-property-decorator'

const doNothing = () => {}

@Component
export default class Dialog extends Vue {
  dialog = true
  isConfirmed = false
  @Prop(Function) onConfirm: () => void = doNothing
  @Prop(Function) onReject: () => void = doNothing
  @Prop(Function) cleanUp?: () => void
  @Prop(String) title?: string
  @Prop(String) message?: string
  @Watch('dialog')
  onDialogChanged (oldVal: boolean, newVal: boolean) {
    if (!newVal) {
      this.isConfirmed || this.onReject()
      this.$destroy()
      this.cleanUp && this.cleanUp()
    }
  }

  commitConfirm () {
    this.isConfirmed = true
    this.onConfirm()
    this.dialog = false
  }
  commitReject () {
    this.isConfirmed = false
    this.onReject()
    this.dialog = false
  }

}