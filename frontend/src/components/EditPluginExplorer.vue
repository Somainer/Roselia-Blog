<template>
  <v-dialog v-model="dialog">
    <v-card>
      <v-toolbar color="primary">
        <v-btn icon="mdi-close" @click="dialog = false"></v-btn>
        <v-toolbar-title>Plugins</v-toolbar-title>
        <v-spacer></v-spacer>
      </v-toolbar>
      <div>
        <v-list-subheader>Select Plugin</v-list-subheader>
        <v-select
          :items="items"
          label="Plugin..."
          prepend-icon="mdi-puzzle"
          v-model="selected"
          item-title="text"
          item-value="value"
          return-object
        ></v-select>
      </div>
      <v-divider></v-divider>
      <div>
        <v-list-subheader>{{ selected && selected.text }}</v-list-subheader>
        <component :is="currentComponent"></component>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  name: 'plugin-explorer',
  props: {
    modelValue: { type: Boolean, default: false },
    plugins: { type: Array as PropType<any[]>, default: () => [] }
  },
  emits: ['update:modelValue'],
  data() {
    return { selected: {} as any }
  },
  computed: {
    items(): any[] {
      return this.plugins.map((p: any) => ({ text: p.name, value: p.component }))
    },
    dialog: {
      get(): boolean {
        return this.modelValue
      },
      set(val: boolean) {
        this.$emit('update:modelValue', val)
      }
    },
    currentComponent(): any {
      return this.selected && this.selected.value
    }
  }
})
</script>
