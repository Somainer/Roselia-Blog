<template>
  <v-toolbar
    color="primary"
    dark
    scroll-off-screen
  >
    <slot></slot>
    <v-toolbar-title>
      <router-link  class="white--text no-deco" :to="{name:'index'}">{{title}}</router-link>
    </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-toolbar-items>
      <v-btn dark flat to="/">Index</v-btn>
      <v-btn dark flat to="/timeline">Timeline</v-btn>
      <v-btn dark flat v-if="userData" to="/userspace">{{userData.nickname}}</v-btn>
      <v-btn dark flat v-else tag="a" @click.native="setRedirect" :to="{name: 'login'}" @contextmenu="portedLogin($event)">Login</v-btn>
    </v-toolbar-items>
  </v-toolbar>
</template>

<script>
import meta from '../common/config'
import utils from '../common/utils'
export default {
  name: 'blog-toolbar',
  props: ['userData', 'route'],
  data () {
    return {
      title: meta.title
    }
  },
  methods: {
    setRedirect () {
      utils.setRedirect(this.route)
    },
    portedLogin (ev) {
      ev.preventDefault()
      let w = window.open(this.$router.resolve({
        name: 'login',
        query: {
          ported: true
        }
      }).href, 'loginWindow', 'height=400,width=400,top=0,left=0,toolbar=no,menubar=no,scrollbars=no, resizable=no,location=no, status=no')
      let unwatch = this.$watch('userData', (data) => {
        if (data) {
          w.close()
          unwatch()
        }
      })
      w.addEventListener('close', unwatch)
    }
  }
}
</script>

<style scoped>

</style>
