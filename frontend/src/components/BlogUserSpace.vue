<template>
  <v-app :dark="dark">
    <blog-toolbar :userData="userData">
      <v-toolbar-side-icon dark @click.native="drawer = !drawer"></v-toolbar-side-icon>
    </blog-toolbar>
    <v-navigation-drawer
      v-model="drawer"
      fixed
      clipped
      app
    >
      <v-list
        dense
      >
        <template v-for="(item, i) in items">
          <v-layout
            v-if="item.heading"
            :key="i"
            row
            align-center
          >
            <v-flex xs6>
              <v-subheader v-if="item.heading">
                {{ item.heading }}
              </v-subheader>
            </v-flex>
          </v-layout>
          <v-divider
            v-else-if="item.divider"
            :key="i"
            dark
            class="my-3"
          ></v-divider>
          <v-list-tile
            v-else-if="!item.click"
            :key="i"
            ripple
            :to="item.to"
          >
            <v-list-tile-action>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title class="grey--text">
                {{ item.text }}
              </v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile
            v-else
            :key="i"
            ripple
            @click="item.click"
          >
            <v-list-tile-action>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title class="grey--text">
                {{ item.text }}
              </v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </template>
      </v-list>
    </v-navigation-drawer>
    <v-content>
      <v-container fluid fill-height>
        <v-layout justify-center align-center>
          <v-flex shrink>
            <!--<h1 class="display-3">Well met, {{userData.username}}!</h1>-->
            <v-alert
              v-model="toast.show"
              :type="toast.color"
              transition="scale-transition"
            >
              {{ toast.text }}
            </v-alert>
            <v-slide-x-transition hide-on-leave>
              <router-view :userData="userData" :toast="showToast"></router-view>
            </v-slide-x-transition>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
    <toast v-bind="toast" @showChange="changeToast"></toast>
  </v-app>
</template>

<script>
import BlogToolbar from './BlogToolbar'
import utils from '../common/utils'
import app from '../App'
const userData = (function () {
  let loginData = utils.getLoginData();
  return () => {
    if (loginData) return loginData;
    loginData = utils.getLoginData();
    return loginData || null;
  };
})();
export default {
  components: {BlogToolbar},
  name: 'blog-user-space',
  data () {
    return {
      userData: null,
      toast: {
        show: false,
        text: '',
        color: ''
      },
      drawer: null,
      dark: app.computed.isNight()
    }
  },
  computed: {
    items () {
      return [
        { icon: 'home', text: 'Home', to: {name: 'console-index'} },
        { divider: true },
        { heading: 'Writing posts' },
        { icon: 'add_circle', text: 'Write a new post', to: {name: 'edit'}, cond: this.userData.role },
        { icon: 'delete', text: 'Remove all drafts', click: this.removeAllDraft },
        { divider: true },
        { heading: 'My Account' },
        { icon: 'account_box', text: 'Account Settings', to: {name: 'setNickname'}},
        { icon: 'account_box', text: 'OAuth accounts', to: {name: 'oauthAccounts'}, cond: false},
        { icon: 'security', text: 'Two step auth', to: {name: 'twoStepAuth'} },
        { divider: true },
        { heading: 'Management' },
        { icon: 'lock', text: 'Change password', to: {name: 'changePassword'} },
        { icon: 'people', text: 'Manage User', to: {name: 'userManagement'}, cond: this.userData.role },
        { divider: true },
        // { icon: 'refresh', text: 'Token Refresh', click: this.refreshToken, cond: userData().rftoken },
        { heading: 'My Session' },
        { icon: 'refresh', text: 'Token Refresh', to: {name: 'tokenRefresh'}, cond: this.userData.rftoken },
        { icon: 'verified_user', text: 'Remote Login', to: {name: 'remoteLogin'} },
        { divider: true },
        { icon: 'exit_to_app', text: 'Log Out', to: {name: 'login', params: {logout: true}} }
      ].filter(itm => !itm.hasOwnProperty('cond') || itm.cond)
    }
  },
  methods: {
    showToast (text, color = 'info') {
      this.toast = this.toast || {}
      this.toast.show = false
      this.toast.text = text.toString()
      this.toast.color = color
      this.toast.show = true
    },
    changeToast (show) {
      this.toast.show = show
    },
    makeRedirect (to) {
      utils.setRedirect(this.$route.fullPath)
      utils.redirectTo(to)
    },
    removeAllDraft () {
      let storage = window.localStorage
      Array.from(Array(storage.length).keys()).map(storage.key.bind(storage)).filter(x => x.startsWith('postDraft')).forEach(k => {
        storage.removeItem(k)
      })
      this.showToast('Draft Cleaned!')
    }
  },
  mounted () {
    this.userData = utils.getLoginData()
    if (!this.userData) {
      // this.showToast('Please login first', 'warning')
      return this.makeRedirect({
        name: 'login',
        params: {
          logout: true,
          message: 'Login to manage',
          alert: {
            color: 'warning',
            text: 'Please login first'
          }
        }
      })
    }
    window.addEventListener('storage', e => {
      if (e.key === 'loginData') {
        console.log(e)
        this.userData = utils.getLoginData()
      }
    })
  },
  destroyed() {
    utils.removeSUToken()
  }
}
</script>

<style scoped>

</style>
