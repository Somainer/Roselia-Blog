<template>
  <div>
    <div v-if="!visible" v-observe-visibility="setVisible">
      <v-row align="center" justify="center">
        <v-btn @click="setVisible">{{ text }}</v-btn>
      </v-row>
    </div>
    <div v-else>
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'lazy-component',
  props: {
    text: { type: String, default: '' }
  },
  data() {
    return { visible: false }
  },
  methods: {
    setVisible() {
      this.visible = true
    }
  }
})
</script>
