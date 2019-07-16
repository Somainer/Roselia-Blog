<template>
  <v-snackbar
    v-model="showSelf"
    :color="color"
    top right
    :timeout="6000"
  >
    {{ text }}
    <v-btn
      flat
      @click="showSelf = false"
    >
      Close
    </v-btn>
  </v-snackbar>
</template>

<script>
export default {
  name: 'toast',
  props: ['show', 'text', 'color'],
  computed: {
    showSelf: {
      get: function() {
        return this.show
      },
      set: function(value) {
        this.$emit('showChange', value)
      }
    }
  }
}
</script>

<style scoped>

</style>
