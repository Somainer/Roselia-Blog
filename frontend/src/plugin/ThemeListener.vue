<template>
  <div class="listener" ref="listener"></div>
</template>
<script>
// v-model: undefined when not support prefered theme, true if light and false if dark.
export default {
  mounted() {
    this.emitScheme()
    this.$refs.listener.addEventListener('transitionend', () => {
      this.emitScheme()
    })
  },
  methods: {
    emitScheme() {
      const scheme = getComputedStyle(this.$refs.listener).getPropertyValue('--scheme').trim()
      const boolValue = scheme === 'transparent' ? undefined : (scheme === 'none')
      this.$emit('change', boolValue)
    }
  },
  model: {
    prop: 'scheme',
    event: 'change'
  },
  props: ['scheme']
}
</script>

<style scoped>
  .listener {
    --scheme: transparent;
    color: var(--scheme);
    transition: color 10ms;
  }
  @media (prefers-color-scheme: light) {
    .listener {
      --scheme: none;
    }
  }

  @media (prefers-color-scheme: dark) {
    .listener {
      --scheme: black;
    }
  }
</style>

