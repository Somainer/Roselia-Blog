<template>
  <v-footer
    height="auto"
    color="primary lighten-1"
  >
    <v-layout
      justify-center
      row
      wrap
    >

      <v-flex
        primary
        lighten-2
        py-3
        text-xs-center
        white--text
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

</style>
