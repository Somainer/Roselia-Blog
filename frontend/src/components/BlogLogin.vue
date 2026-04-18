<template>
  <v-container fluid class="fill-height">
    <blog-toolbar :user-data="userData" :should-hide="true"></blog-toolbar>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary">
            <v-btn
              v-if="$route.query.ported"
              variant="text"
              icon="mdi-close"
              onclick="window.self.close()"
            ></v-btn>
            <v-btn v-else variant="text" icon="mdi-arrow-left" to="/"></v-btn>
            <v-toolbar-title>{{ title }}</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card-text>
            <v-alert
              v-if="toast.show"
              v-model="toast.show"
              :type="toast.color"
              closable
            >
              {{ toast.text }}
            </v-alert>
            <h2 class="text--secondary">{{ message }}</h2>

            <v-window v-model="currentLayer">
              <v-window-item :value="2">
                <div v-if="loading && !loginCode">
                  <h3 class="text-h4">Please standby...</h3>
                  <v-progress-linear indeterminate color="accent"></v-progress-linear>
                </div>
              </v-window-item>
              <v-window-item :value="0">
                <v-form v-if="!loading && !loginCode" v-model="valid">
                  <v-text-field
                    v-model="username"
                    prepend-icon="mdi-account"
                    name="username"
                    label="Username"
                    type="text"
                    autofocus
                    :rules="rules"
                    @keyup.enter="focusPassword"
                  ></v-text-field>
                  <v-text-field
                    v-model="password"
                    ref="passWord"
                    id="password"
                    prepend-icon="mdi-lock"
                    name="password"
                    label="Password"
                    type="password"
                    :rules="rules"
                    @keyup.enter="login"
                  ></v-text-field>
                </v-form>
              </v-window-item>
              <v-window-item :value="1">
                <v-container v-if="loginCode">
                  <v-row align="center" justify="center">
                    <div v-if="scannedUsername">
                      <h6 class="text-h4">Welcome, please confirm:</h6>
                      <h1 class="text-info text-h3">{{ scannedUsername }}</h1>
                    </div>
                    <div v-else>
                      <h6 class="text-h4">Your login code:</h6>
                      <h1 class="text-primary text-h3">{{ loginCode }}</h1>
                    </div>
                  </v-row>
                </v-container>
              </v-window-item>
              <v-window-item :value="3">
                <v-container>
                  <v-row align="center" justify="center">
                    <div>
                      <h6>One more step</h6>
                      <v-text-field v-model="authLoginCode" @keyup.enter="login"></v-text-field>
                      <v-btn color="primary" size="small" rounded @click="forceStep = 0">Give Up</v-btn>
                    </div>
                  </v-row>
                </v-container>
              </v-window-item>
            </v-window>

            <v-row v-if="!loading && hasOauthAdapter" align="center" justify="center">
              <h4>Login using</h4>
              <div>
                <div class="text-center">
                  <v-btn
                    v-for="adapter in oauthLogin.adapters"
                    :key="adapter"
                    rounded
                    color="accent"
                    :loading="oauthLogin.loading"
                    class="ma-1"
                    @click="redirectOauthLogin(adapter)"
                  >
                    <v-icon>mdi-{{ adapter }}</v-icon>
                    <span v-if="!adapter">{{ adapter }}</span>
                  </v-btn>
                </div>
              </div>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <div v-if="!oauthLogin.loading">
              <v-btn v-if="loginCode" color="info" @click="codeLoginCleanUp">With username</v-btn>
              <v-btn v-else color="secondary" @click="codeLogin">With access code</v-btn>
            </div>
            <v-spacer></v-spacer>
            <v-btn color="primary" :loading="loading" :disabled="!valid" @click="login">Login</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <toast v-model="toast.show" :text="toast.text" :color="toast.color" v-show="false"></toast>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import meta from '@/common/config'
import utils from '../common/utils'
import BlogToolbar from './BlogToolbar.vue'

export default defineComponent({
  name: 'blog-login',
  components: { BlogToolbar },
  props: {
    userData: { type: Object as PropType<any>, default: null }
  },
  emits: ['beforeLogin'],
  data() {
    return {
      loading: false,
      title: meta.title,
      toast: { show: false, text: '', color: '' as string },
      username: '',
      password: '',
      rules: [
        (v: string) => !!v || 'Required',
        (v: string) => (v && v.length > 4 && v.length < 20) || 'Length is not valid'
      ],
      valid: false,
      loginCode: '',
      scannedUsername: '',
      focusAt: false,
      oauthLogin: { loading: false, adapters: [] as string[] },
      authLoginCode: '',
      forceStep: 0,
      redirectLock: false,
      codeChecker: undefined as number | undefined,
      codeLoginCleaner: undefined as number | undefined
    }
  },
  computed: {
    redirection(): string {
      return ((this.$route.params as any).redirect || (this.$route.query as any).redirect || utils.getRedirect() || '/') as string
    },
    message(): string {
      return window.sessionStorage.getItem('message') || (this.$route.params as any).message || 'Login'
    },
    hasOauthAdapter(): boolean {
      return this.oauthLogin.adapters.length > 0
    },
    currentLayer(): number {
      if (this.forceStep) return this.forceStep
      const state = ((this.loading ? 1 : 0) << 1) | (this.loginCode ? 1 : 0)
      return (state & 1) || (state & 2)
    }
  },
  watch: {
    userData(val: any) {
      if (val) this.redirectBack()
    }
  },
  mounted() {
    if (this.userData) {
      if ((this.$route.params as any).logout) {
        utils.removeLoginData()
        this.showToast('Logged out!')
      } else {
        this.redirectBack()
      }
    }
    if ((this.$route.query as any).alertText) {
      const { alertText, alertColor } = this.$route.query as any
      this.$router.replace({
        ...this.$route,
        params: {
          ...(this.$route.params as any),
          alert: { text: alertText, color: alertColor }
        },
        query: { ...this.$route.query, alertColor: undefined, alertText: undefined }
      } as any)
      this.showToast(alertText, alertColor)
    }
    if ((this.$route.params as any).alert) {
      const { color, text } = (this.$route.params as any).alert
      this.showToast(text, color)
    }
    const token = (utils.getArguments.call(this) as any).token
    if (token) {
      this.tokenLogin(token).catch(() => {
        this.getAdapters()
        this.$router.replace({
          ...this.$route,
          query: { ...this.$route.query, token: undefined }
        } as any)
      })
    }
    if ((this.$route.params as any).credential) {
      const { username, password } = (this.$route.params as any).credential
      this.username = username || this.username
      this.password = password || this.password
      if (this.username && this.password) this.login()
      if (this.username) this.focusPassword()
    }
    if (!token) this.getAdapters()
  },
  unmounted() {
    this.oauthLogin.loading || this.cleanUp()
    this.codeLoginCleanUp()
  },
  methods: {
    login() {
      if (!this.valid) return
      this.$emit('beforeLogin')
      this.loading = true
      utils.fetchJSON(utils.apiFor('login'), 'POST', {
        username: this.username,
        password: this.password,
        code: this.authLoginCode
      }, false).then((data: any) => {
        if (!data.success) {
          if (data.totp) {
            this.forceStep = 3
            if (!this.authLoginCode) return Promise.reject({
              msg: 'Please enter two step authentication code',
              color: 'info'
            })
          }
          return Promise.reject(data.msg)
        }
        this.setLoginData({
          username: this.username,
          token: data.token,
          role: data.role,
          rftoken: data.rftoken
        }).then(() => this.redirectBack())
      }).catch((reason: any) => {
        if (reason.color) this.showToast(reason.msg, reason.color)
        else this.showToast(reason, 'error')
        this.loading = false
      })
    },
    redirectBack() {
      if (this.redirectLock) return
      this.$router.push(this.redirection)
      this.redirectLock = true
    },
    showToast(text: string, color = 'info') {
      this.toast.show = false
      this.toast.text = String(text)
      this.toast.color = color
      this.toast.show = true
    },
    changeToast(show: boolean) {
      this.toast.show = show
    },
    cleanUp() {
      utils.cleanRedirect()
      window.sessionStorage.removeItem('message')
    },
    setLoginData({ username, ...rest }: any) {
      return utils.fetchJSONWithSuccess(utils.apiFor('user', 'user-meta'), 'GET', { username }).then(({ username, nickname }: any) => {
        utils.setLoginData({ username, nickname, ...rest })
      }).catch(() => {
        utils.setLoginData({ username, nickname: username, ...rest })
      })
    },
    tokenLogin(token: string) {
      this.loading = true
      return utils.fetchJSON(utils.apiFor('login', 'token'), 'POST', { token }, false).then((data: any) => {
        if (!data.success) return Promise.reject(data.msg)
        this.setLoginData({
          username: data.payload.username,
          token,
          role: data.payload.role
        }).then(() => this.redirectBack())
      }).catch((reason: any) => {
        this.loading = false
        this.showToast(reason, 'error')
        return Promise.reject(reason)
      }).finally(this.cleanUp)
    },
    getLoginCode() {
      return utils.fetchJSON(utils.apiFor('login', 'code', 'gen')).then((data: any) => data.code)
    },
    codeLoginTriggers() {
      this.codeChecker = window.setInterval(() => {
        if (!this.loginCode) return
        utils.fetchJSON(utils.apiFor('login', 'code', this.loginCode), 'POST', {}, false).then((data: any) => {
          if (!data.success) return
          const payload = data.data
          if (payload.username) this.scannedUsername = payload.username
          if (payload.token) {
            this.setLoginData({
              username: payload.username,
              role: payload.role,
              token: payload.token
            }).then(() => this.redirectBack())
          }
        }).catch(() => {
          this.showToast('Unstable network may affect remote login.', 'warning')
        })
      }, 3000)
      this.codeLoginCleaner = window.setTimeout(() => this.codeLoginCleanUp(), 60000)
    },
    codeLogin() {
      this.loading = true
      this.loginCode = 'Loading...'
      this.getLoginCode().then((code: any) => {
        this.loginCode = (Array(6).join('0') + code).slice(-6)
      }).then(() => this.codeLoginTriggers()).catch((err: any) => {
        this.showToast(err, 'error')
        this.codeLoginCleanUp()
      })
    },
    codeLoginCleanUp() {
      this.codeChecker && clearInterval(this.codeChecker)
      this.codeLoginCleaner && clearTimeout(this.codeLoginCleaner)
      this.loading = false
      this.loginCode = ''
      this.scannedUsername = ''
    },
    focusPassword() {
      if (this.rules.map(r => r(this.username)).every(x => x === true)) {
        ;(this.$refs.passWord as any)?.focus?.()
      }
    },
    getAdapters() {
      utils.fetchJSONWithSuccess(utils.apiFor('login', 'oauth', 'adapters')).then((adps: string[]) => {
        this.oauthLogin.adapters = adps
      }).catch((err: any) => this.showToast(err, 'error'))
    },
    redirectOauthLogin(adapter: string) {
      this.oauthLogin.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('login', 'oauth', adapter, 'url'), 'GET', {
        base: window.location.href.split('?')[0],
        redirect: this.redirection
      }).then((url: string) => {
        this.loading = true
        window.location.href = url
      }).catch((err: any) => {
        this.oauthLogin.loading = false
        this.showToast(err, 'error')
      })
    }
  }
})
</script>
