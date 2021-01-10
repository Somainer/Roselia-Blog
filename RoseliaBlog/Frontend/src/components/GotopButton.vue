<template>
  <v-layout
    v-scroll="recordScroll"
    v-resize="recordHeight"
  >
    <v-fab-transition>
      <v-btn
        color="secondary"
        fab
        fixed
        bottom
        right
        class="fixed-action-btn"
        @click="goTop"
        :style="{
        bottom: $vuetify.breakpoint.smOnly ? '64px' : ''
      }"
        v-show="showButton"
      >
        <v-icon>keyboard_arrow_up</v-icon>
      </v-btn>
    </v-fab-transition>

  </v-layout>

</template>

<script>
import directives from 'vuetify/lib/directives'
export default {
  name: 'gotop-button',
  directives,
  data: function () {
    return {
      height: 0,
      offsetTop: 0
    }
  },
  methods: {
    recordHeight () {
      this.height = window.innerHeight
    },
    recordScroll () {
      this.offsetTop = window.pageYOffset || document.documentElement.scrollTop
    },
    goTop () {
      // this.$router.push({ hash: '' })
      this.$vuetify.goTo(0)
    }
  },
  mounted () {
    this.recordHeight()
    this.recordScroll()
  },
  computed: {
    showButton () {
      return this.offsetTop >= this.height
    }
  }
}
</script>

<style scoped>

</style>
