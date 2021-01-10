<template>
  <v-footer
    :padless="true"
  >
    <v-card
      flat
      tile
      width="100%"
      class="oneness text-center"
    >
      <v-card-text class="white--text">
        &copy;{{year}} — <strong>{{ name }}</strong>
      </v-card-text>
    </v-card>
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
