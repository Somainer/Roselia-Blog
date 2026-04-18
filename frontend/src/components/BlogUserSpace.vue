<template>
  <div>
    <blog-toolbar :user-data="userData" :no-drawer="true">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
    </blog-toolbar>
    <v-navigation-drawer v-model="drawer" temporary>
      <v-list density="compact">
        <template v-for="(item, i) in items" :key="i">
          <v-list-subheader v-if="item.heading">{{ item.heading }}</v-list-subheader>
          <v-divider v-else-if="item.divider" class="my-3"></v-divider>
          <v-list-item
            v-else-if="!item.click"
            :prepend-icon="item.icon"
            :title="item.text"
            :to="item.to"
          ></v-list-item>
          <v-list-item
            v-else
            :prepend-icon="item.icon"
            :title="item.text"
            @click="item.click"
          ></v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-container fluid class="fill-height">
        <v-row justify="center" align="center">
          <v-col cols="10">
            <v-alert
              v-if="toast.show"
              v-model="toast.show"
              :type="toast.color || 'info'"
              closable
            >
              {{ toast.text }}
            </v-alert>
            <v-slide-x-transition hide-on-leave>
              <router-view
                :user-data="userData"
                :toast="showToast"
                :current-color-scheme="currentColorScheme"
              ></router-view>
            </v-slide-x-transition>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <toast v-model="toast.show" :text="toast.text" :color="toast.color"></toast>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import BlogToolbar from './BlogToolbar.vue'
import utils from '@/common/utils'

export default defineComponent({
  name: 'blog-user-space',
  components: { BlogToolbar },
  props: {
    currentColorScheme: { type: Boolean, default: true },
    userData: { type: Object as PropType<any>, default: null }
  },
  data() {
    return {
      toast: { show: false, text: '', color: '' as any },
      drawer: false as boolean,
      removeListener: null as null | (() => void)
    }
  },
  computed: {
    items(): any[] {
      const u = this.userData || {}
      return [
        { icon: 'mdi-home', text: 'Home', to: { name: 'userspace' } },
        { divider: true },
        { heading: 'Articles' },
        { icon: 'mdi-plus-circle', text: 'Write a new post', to: { name: 'edit' }, cond: u.role },
        { icon: 'mdi-archive', text: 'Manage Drafts', to: { name: 'manageDrafts' }, cond: u.role },
        { icon: 'mdi-timeline', text: 'My Timeline', to: { name: 'userTimeline', params: { username: u.username } } },
        { divider: true },
        { heading: 'My Account' },
        { icon: 'mdi-account-box', text: 'Account Settings', to: { name: 'setNickname' } },
        { icon: 'mdi-account-circle', text: 'OAuth Accounts', to: { name: 'oauthAccounts' } },
        { icon: 'mdi-shield-lock', text: 'Two Step Auth', to: { name: 'twoStepAuth' } },
        { divider: true },
        { heading: 'Management' },
        { icon: 'mdi-lock', text: 'Change Password', to: { name: 'changePassword' } },
        { icon: 'mdi-account-multiple', text: 'Manage User', to: { name: 'userManagement' }, cond: u.role },
        { icon: 'mdi-monitor', text: 'System Monitor', to: { name: 'systemMonitor' }, cond: u.role > 1 },
        { icon: 'mdi-image', text: 'Image Management', to: { name: 'manageImages' }, cond: u.role },
        { divider: true },
        { heading: 'My Session' },
        { icon: 'mdi-refresh', text: 'Token Refresh', to: { name: 'tokenRefresh' }, cond: u.rftoken },
        { icon: 'mdi-account-check', text: 'Remote Login', to: { name: 'remoteLogin' } },
        { divider: true },
        { icon: 'mdi-information', text: 'About', to: { name: 'about' } },
        { icon: 'mdi-logout', text: 'Log Out', to: { name: 'login', params: { logout: true } } }
      ].filter(itm => !('cond' in itm) || (itm as any).cond)
    }
  },
  watch: {
    userData() {
      this.ensureLoggedIn()
    }
  },
  mounted() {
    this.ensureLoggedIn()
  },
  unmounted() {
    utils.removeSUToken()
    this.removeListener && this.removeListener()
  },
  methods: {
    showToast(text: string, color: string = 'info') {
      this.toast.show = false
      this.toast.text = String(text)
      this.toast.color = color
      this.toast.show = true
    },
    changeToast(show: boolean) {
      this.toast.show = show
    },
    ensureLoggedIn() {
      if (!this.userData) {
        this.$router.push({
          name: 'login',
          params: {
            logout: true,
            message: 'Login to manage',
            alert: { color: 'warning', text: 'Please login first' },
            redirect: this.$route.fullPath
          }
        } as any)
      }
    },
    removeAllDraft() {
      const storage = window.localStorage
      Array.from(Array(storage.length).keys()).map(k => storage.key(k)).filter((x): x is string => !!x && x.startsWith('postDraft')).forEach(k => {
        storage.removeItem(k)
      })
      this.showToast('Draft Cleaned!')
    }
  }
})
</script>
