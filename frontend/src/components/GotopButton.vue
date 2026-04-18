<template>
  <div v-scroll="recordScroll" v-resize="recordHeight">
    <v-fab-transition>
      <v-btn
        v-show="showButton"
        color="secondary"
        icon="mdi-chevron-up"
        class="fixed-action-btn"
        :style="{
          position: 'fixed',
          right: '16px',
          bottom: display.smAndDown.value ? '64px' : '16px',
          zIndex: 6
        }"
        @click="goTop"
      ></v-btn>
    </v-fab-transition>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useDisplay, useGoTo } from 'vuetify'

export default defineComponent({
  name: 'gotop-button',
  setup() {
    const display = useDisplay()
    const goTo = useGoTo()
    return { display, goTo }
  },
  data() {
    return { height: 0, offsetTop: 0 }
  },
  computed: {
    showButton(): boolean {
      return this.offsetTop >= this.height
    }
  },
  methods: {
    recordHeight() {
      this.height = window.innerHeight
    },
    recordScroll() {
      this.offsetTop = window.pageYOffset || document.documentElement.scrollTop
    },
    goTop() {
      this.goTo(0)
    }
  },
  mounted() {
    this.recordHeight()
    this.recordScroll()
  }
})
</script>
