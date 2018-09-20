<template>
  <v-layout
    v-scroll="recordScroll"
    v-resize="recordHeight"
  >
    <v-scale-transition origin="center center 0">
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
        v-if="showButton"
      >
        <v-icon>keyboard_arrow_up</v-icon>
      </v-btn>
    </v-scale-transition>

  </v-layout>

</template>

<script>
export default {
  name: 'gotop-button',
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
