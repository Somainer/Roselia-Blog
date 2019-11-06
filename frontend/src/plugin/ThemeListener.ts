import Vue from 'vue'
// v-model: undefined when not support preferred theme, true if light and false if dark.
export default Vue.extend({
  mounted() {
    this.checkScheme()
  },
  methods: {
    setState(s?: boolean) {
      this.$emit('change', s)
    },
    checkScheme() {
      const prefersDark = matchMedia('(prefers-color-scheme: dark)')
      const prefersLight = matchMedia('(prefers-color-scheme: light)')
      if(prefersDark.matches || prefersLight.matches) {
        this.setState(prefersLight.matches)
        prefersDark.addEventListener('change', m => this.setState(!m.matches))
        prefersLight.addEventListener('change', m => this.setState(m.matches))
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
  },
  render(h) {
    return h()
  }
})
