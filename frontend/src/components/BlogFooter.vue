<template>
  <v-footer class="oneness">
    <v-row justify="center">
      <v-col class="themed-text text-center py-3" cols="12">
        &copy;{{year}} — <strong>{{ name }}</strong>
      </v-col>
    </v-row>
  </v-footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import meta from '@/common/config'

export default defineComponent({
  name: 'blog-footer',
  data() {
    return {
      year: new Date().getFullYear(),
      title: meta.title,
      motto: meta.motto,
      name: meta.footerName
    }
  }
})
</script>

<style scoped>
.oneness {
  background: linear-gradient(45deg, var(--theme-color) 15%, var(--theme-secondary-color) 85%);
}
</style>
