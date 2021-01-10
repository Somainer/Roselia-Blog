<template>
  <v-container fluid grid-list-md class="text-center fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12">
        <h3 class="display-3">{{ config.title }}</h3>

        <v-divider class="my-3"></v-divider>

        <p><span class="subtitle-1">{{ config.motto }}</span></p>
        <p><span class="subtitle-1">Powered by <strong class="primary--text">Roselia-Blog</strong> V{{version}}</span></p>
        
        <div>
          Theme
          <v-dialog v-for="(value, key) in theme" :key="key" max-width="500">
            <template v-slot:activator="{ on: dialog }">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    class="ma-1"
                    :color="key"
                    dark
                    v-bind="attrs"
                    v-on="{...on, ...dialog}"
                  >{{ key }}</v-btn>
                </template>
                <span>{{ value }}</span>
              </v-tooltip>
            </template>
            <v-card>
              <v-card-title class="headline primary lighten-2">
                Set Color for {{ key }}
              </v-card-title>
              <v-row justify="center">
                <v-color-picker v-model="theme[key]" show-swatches swatches-max-height="300px" />
              </v-row>
            </v-card>
          </v-dialog>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import Vue from 'vue'
import config from '../../common/config'

export default Vue.extend({
  props: {
    currentColorScheme: Boolean
  },
  data() {
    return {
      version: process.env.VUE_APP_VERSION,
      config
    }
  },
  computed: {
    theme() {
      return this.$vuetify.theme.currentTheme
    }
  }
})
</script>