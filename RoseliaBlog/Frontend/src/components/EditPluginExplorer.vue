<template>
  <v-dialog v-model="dialog">
    <v-card>
      <v-toolbar dark color="primary">
        <v-btn icon dark @click="dialog = false">
          <v-icon>close</v-icon>
        </v-btn>
        <v-toolbar-title>Plugins</v-toolbar-title>
        <v-spacer></v-spacer>
      </v-toolbar>
      <div>
        <v-subheader>Select Plugin</v-subheader>
        <v-select
          :items="items"
          label="Plugin..."
          prepend-icon="extension"
          v-model="selected"
          return-object
        ></v-select>
      </div>
      <v-divider></v-divider>
      <div>
        <v-subheader>{{ selected.text }}</v-subheader>
        <component :is="currentComponent"></component>
      </div>
    </v-card>
  </v-dialog>
</template>
<script>
  export default {
    name: 'plugin-explorer',
    model: {
      prop: 'open',
      event: 'change'
    },
    props: {
      open: Boolean,
      plugins: Array
    },
    data () {
      return {
        selected: {}
      }
    },
    computed: {
      items() {
        return this.plugins.map(p => ({
          text: p.name,
          value: p.component
        }))
      },
      dialog: {
        get() {
          return this.open
        },
        set(val) {
          this.$emit('change', val)
        }
      },
      currentComponent() {
        return this.selected.value
      }
    }
  }
</script>