<template>
  <v-footer
    height="auto"
    class="oneness"
  >
    <v-row
      justify="center"
      wrap
    >

      <v-col
        class="themed-text text-center lighten-2 py-3"
        cols="12"
      >
        &copy;{{year}} — <strong>{{ name }}</strong>
      </v-col>
    </v-row>
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
      motto: meta.motto,
      name: meta.footerName
    }
  }
}
</script>

<style scoped>
.oneness {
  background: linear-gradient(45deg, var(--theme-color) 15%, var(--theme-secondary-color) 85%);
}
</style>
