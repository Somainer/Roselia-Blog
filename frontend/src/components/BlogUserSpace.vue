<template>
  <v-app :dark="!currentColorScheme">
    <blog-toolbar :userData="userData" :noDrawer="true">
      <v-app-bar-nav-icon dark @click.native="drawer = !drawer"></v-app-bar-nav-icon>
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
          <v-row
            v-if="item.heading"
            :key="i"
            row
            align-center
          >
            <v-col>
              <v-subheader v-if="item.heading" inset>
                {{ item.heading }}
              </v-subheader>
            </v-col>
          </v-row>
          <v-divider
            v-else-if="item.divider"
            :key="i"
            dark
            class="my-3"
          ></v-divider>
          <v-list-item
            v-else-if="!item.click"
            :key="i"
            ripple
            :to="item.to"
          >
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="grey--text">
                {{ item.text }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item
            v-else
            :key="i"
            ripple
            @click="item.click"
          >
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="grey--text">
                {{ item.text }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>
    <v-content>
      <v-container fluid fill-height>
        <v-row justify="center" align="center">
          <v-col cols="10" class="shrink">
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
          </v-col>
        </v-row>
      </v-container>
    </v-content>
    <toast v-bind="toast" @showChange="changeToast"></toast>

  </v-app>
</template>

<script>
import BlogToolbar from './BlogToolbar'
import utils from '@/common/utils'
export default {
  components: {BlogToolbar},
  name: 'blog-user-space',
  data () {
    return {
      toast: {
        show: false,
        text: '',
        color: ''
      },
      drawer: null,
      removeListener: null
    }
  },
  props: {
    currentColorScheme: Boolean,
    userData: Object
  },
  computed: {
    items () {
      return [
        { icon: 'home', text: 'Home', to: {name: 'userspace'} },
        { divider: true },
        { heading: 'Articles' },
        { icon: 'add_circle', text: 'Write a new post', to: {name: 'edit'}, cond: this.userData.role },
        // { icon: 'delete', text: 'Remove all drafts', click: this.removeAllDraft },
        { icon: 'archive', text: 'Manage Drafts', to: {name: 'manageDrafts', cond: this.userData.role }},
        { icon: 'list_alt', text: 'My Timeline', to: {name: 'userTimeline', params: {username: this.userData.username}}},
        { divider: true },
        { heading: 'My Account' },
        { icon: 'account_box', text: 'Account Settings', to: {name: 'setNickname'}},
        { icon: 'account_circle', text: 'OAuth Accounts', to: {name: 'oauthAccounts'}},
        { icon: 'security', text: 'Two Step Auth', to: {name: 'twoStepAuth'} },
        { divider: true },
        { heading: 'Management' },
        { icon: 'lock', text: 'Change Password', to: {name: 'changePassword'} },
        { icon: 'people', text: 'Manage User', to: {name: 'userManagement'}, cond: this.userData.role },
        { icon: 'computer', text: 'System Monitor', to: {name: 'systemMonitor'}, cond: this.userData.role > 1 },
        { icon: 'photo', text: 'Image Managenent', to: {name: 'manageImages'}, cond: this.userData.role },
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
    ensureLoggedIn() {
      if (!this.userData) {
        // this.showToast('Please login first', 'warning')
        this.$router.push({
          name: 'login',
          params: {
            logout: true,
            message: 'Login to manage',
            alert: {
              color: 'warning',
              text: 'Please login first'
            },
            redirect: this.$route.fullPath
          }
        })
      }
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
    this.ensureLoggedIn()
  },
  destroyed() {
    utils.removeSUToken()
    this.removeListener && this.removeListener()
  },
  watch: {
    userData() {
      this.ensureLoggedIn()
    }
  }
}
</script>

<style scoped>

</style>
