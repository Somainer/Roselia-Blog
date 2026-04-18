<template>
  <v-snackbar
    v-model="showSelf"
    :color="color"
    location="top right"
    :timeout="6000"
  >
    {{ text }}
    <template #actions>
      <v-btn variant="text" @click="showSelf = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'toast',
  props: {
    modelValue: { type: Boolean, default: false },
    text: { type: String, default: '' },
    color: { type: String, default: undefined }
  },
  emits: ['update:modelValue'],
  computed: {
    showSelf: {
      get(): boolean {
        return this.modelValue
      },
      set(value: boolean) {
        this.$emit('update:modelValue', value)
      }
    }
  }
})
</script>
