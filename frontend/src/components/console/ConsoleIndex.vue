<template>
  <div>
    <h1 class="text-primary text-h4">Well met, {{ userData.nickname }}({{ userData.username }})!</h1>
    <p>There are {{ posts }} posts from your perspective.</p>
    <p>Take it easy casuse I will NOT break your legs in this page.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import utils from '../../common/utils'

export default defineComponent({
  name: 'ConsoleIndex',
  props: {
    userData: { type: Object as PropType<any>, required: true },
    toast: { type: Function as PropType<(text: string, color?: string) => void>, required: false, default: undefined }
  },
  data() {
    return { posts: 'Loading...' as any }
  },
  mounted() {
    this.loadPostCount()
  },
  methods: {
    loadPostCount() {
      utils.fetchJSON(utils.apiFor('posts'), 'GET', { limit: 1 }).then((data: any) => {
        this.posts = data.total
      })
    }
  }
})
</script>
