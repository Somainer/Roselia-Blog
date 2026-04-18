<template>
  <v-container fluid class="text-center fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12">
        <h3 class="text-h3">{{ config.title }}</h3>
        <v-divider class="my-3"></v-divider>
        <p><span class="text-subtitle-1">{{ config.motto }}</span></p>
        <p><span class="text-subtitle-1">Powered by <strong class="text-primary">Roselia-Blog</strong> V{{ version }}</span></p>

        <div>
          Theme
          <v-dialog v-for="(value, key) in themeColors" :key="key" max-width="500">
            <template #activator="{ props: dialogProps }">
              <v-tooltip location="bottom">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    class="ma-1"
                    :color="String(key)"
                    v-bind="{ ...tooltipProps, ...dialogProps }"
                  >{{ key }}</v-btn>
                </template>
                <span>{{ value }}</span>
              </v-tooltip>
            </template>
            <v-card>
              <v-card-title class="text-h5 bg-primary">Set Color for {{ key }}</v-card-title>
              <v-row justify="center">
                <v-color-picker
                  :model-value="themeColors[key]"
                  @update:model-value="v => setThemeColor(String(key), v)"
                  show-swatches
                  swatches-max-height="300px"
                />
              </v-row>
            </v-card>
          </v-dialog>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useTheme } from 'vuetify'
import config from '../../common/config'

export default defineComponent({
  name: 'about',
  props: {
    currentColorScheme: { type: Boolean, default: true }
  },
  setup() {
    const theme = useTheme()
    return { theme }
  },
  data() {
    return {
      version: (import.meta as any).env?.VUE_APP_VERSION || '',
      config
    }
  },
  computed: {
    themeColors(): Record<string, string> {
      return ((this.theme?.current?.value as any)?.colors ?? {}) as Record<string, string>
    }
  },
  methods: {
    setThemeColor(key: string, value: string) {
      const name = this.theme?.current?.value?.dark ? 'dark' : 'light'
      const themes = (this.theme as any).themes.value
      if (themes?.[name]?.colors) {
        themes[name].colors[key] = value
      }
    }
  }
})
</script>
