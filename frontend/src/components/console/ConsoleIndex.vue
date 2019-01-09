<template>
<v-card-action>
  <h1 class="primary--text display-1">Well met, {{ userData.nickname }}({{ userData.username }})!</h1>
  <p>There are {{ posts }} posts from your perspective.</p>
  <p>Take it easy casuse I will NOT break your legs in this page.</p>
</v-card-action>
  
</template>

<script>
import utils from '../../common/utils'
export default {
  name: 'ConsoleIndex',
  props: ['userData', 'toast'],
  data() {
    return {
      posts: 'Loading...'
    }
  },
  methods: {
    loadPostCount() {
      utils.fetchJSON(utils.apiFor('posts'), 'GET', {limit: 1}).then(data => {
        this.posts = data.total
      })
    }
  },
  mounted() {
    this.loadPostCount()
  }
}
</script>