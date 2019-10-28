<template>
  <div>
    <div v-if="!visible" v-observe-visibility="setVisible">
      <v-row align="center" justify="center">
        <v-btn @click="setVisible">{{ this.text }}</v-btn>
      </v-row>
    </div>
    <div v-else>
      <slot></slot>
    </div>
  </div>
</template>
<script>
export default {
  props: ['text'],
  name: 'lazy-component',
  data() {
    return {
      visible: false
    }
  },
  methods: {
    setVisible() {
      this.visible = true
    }
  }
}
</script>
