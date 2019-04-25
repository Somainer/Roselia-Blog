<template>
  <v-footer
    height="auto"
    class="oneness"
  >
    <v-layout
      justify-center
      row
      wrap
    >

      <v-flex
        py-3
        lighten-2
        text-xs-center
        class="themed-text"
        xs12
      >
        &copy;{{year}} — <strong>Somainer</strong>
      </v-flex>
    </v-layout>
  </v-footer>
</template>

<script>
import meta from '@/common/config'
export default {
  name: 'blog-footer',
  data () {
    return {
      year: (new Date()).getFullYear(),
      title: meta.title,
      motto: meta.motto
    }
  }
}
</script>

<style scoped>
.oneness {
  background: linear-gradient(45deg, var(--theme-color) 15%, var(--theme-secondary-color) 85%);
}
</style>
