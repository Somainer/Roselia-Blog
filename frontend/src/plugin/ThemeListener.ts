import Vue from 'vue'
// v-model: undefined when not support prefered theme, true if light and false if dark.
export default Vue.extend({
  mounted() {
    this.checkScheme()
  },
  methods: {
    setState(s?: boolean) {
      this.$emit('change', s)
    },
    checkScheme() {
      const preferesDark = matchMedia('(prefers-color-scheme: dark)')
      const preferesLight = matchMedia('(prefers-color-scheme: light)')
      if(preferesDark.matches || preferesLight.matches) {
        this.setState(preferesLight.matches)
        preferesDark.addListener(m => this.setState(!m.matches))
        preferesLight.addListener(m => this.setState(m.matches))
      } else {
        this.setState(undefined)
      }
    }
  },
  model: {
    prop: 'scheme',
    event: 'change'
  },
  props: {
    scheme: Boolean
  }
})
