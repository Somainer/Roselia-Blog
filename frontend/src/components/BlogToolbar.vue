<template>
<div>
  <v-toolbar
    color="primary"
    scroll-off-screen
  >
    <v-toolbar-side-icon dark v-if="shouldHaveToolbar" @click.native="drawer = !drawer"></v-toolbar-side-icon>
    <slot></slot>
    <v-toolbar-title>
      <router-link  class="themed-text no-deco" :to="{name:'index'}">{{title}}</router-link>
    </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-toolbar-items v-if="!shouldHaveToolbar">
      <v-btn dark flat to="/">Index</v-btn>
      <v-btn dark flat to="/timeline">Timeline</v-btn>
      <v-btn dark flat v-if="userData" to="/userspace">{{userData.nickname}}</v-btn>
      <v-btn dark flat v-else tag="a" @click.native="setRedirect" :to="{name: 'login'}" @contextmenu="portedLogin($event)">Login</v-btn>
    </v-toolbar-items>
  </v-toolbar>
    <v-navigation-drawer
      v-model="drawer"
      fixed
      clipped
      app
      v-if="shouldHaveToolbar"
    >
      <v-toolbar flat>
      <v-list>
        <v-list-tile>
          <v-list-tile-title class="title">
            {{title}}
          </v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-toolbar>
    <v-divider></v-divider>

    <v-list dense class="pt-0">
      <v-list-tile to="/">
        <v-list-tile-action>
          <v-icon>home</v-icon>
        </v-list-tile-action>

        <v-list-tile-content>
          <v-list-tile-title>Index</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
    <v-list dense class="pt-0">
      <v-list-tile to="/timeline">
        <v-list-tile-action>
          <v-icon>list_alt</v-icon>
        </v-list-tile-action>

        <v-list-tile-content>
          <v-list-tile-title>Timeline</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
    <v-list dense class="pt-0" v-if="userData">
      <v-list-tile to="/userspace">
        <v-list-tile-action>
          <v-icon>account_circle</v-icon>
        </v-list-tile-action>

        <v-list-tile-content>
          <v-list-tile-title>{{userData.nickname}}</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
    <v-list dense class="pt-0" v-else>
      <v-list-tile to="/login" @click="setRedirect">
        <v-list-tile-action>
          <v-icon>person</v-icon>
        </v-list-tile-action>

        <v-list-tile-content>
          <v-list-tile-title>Login</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
    </v-navigation-drawer>
</div>
</template>

<script>
import meta from '../common/config'
import utils from '../common/utils'
export default {
  name: 'blog-toolbar',
  props: ['userData', 'route', 'realTitle', 'noDrawer'],
  data () {
    return {
      drawer: false
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
  },
  computed: {
    title() {
      return this.realTitle || meta.title
    },
    shouldHaveToolbar() {
      return !this.noDrawer && this.$vuetify.breakpoint.smAndDown
    }
  },
  watch: {
    shouldHaveToolbar(val) {
      if(!val) this.drawer = false
    }
  }
}
</script>

<style scoped>

</style>
