<template>
  <v-container fluid fill-height>
    <v-layout align-center justify-center>
      <v-flex xs12 sm8 md4>
        <v-card class="elevation-12">
          <v-toolbar dark color="primary">
            <v-btn v-if="this.$route.query.ported" flat fab onclick="window.self.close()">
              <v-icon>close</v-icon>
            </v-btn>
            <v-btn v-else flat fab to="/">
              <v-icon>arrow_back</v-icon>
            </v-btn>
            <v-toolbar-title>{{title}}</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card-text>
            <v-alert
              v-model="toast.show"
              :type="toast.color"
              transition="scale-transition"
              dismissible
            >
              {{ toast.text }}
            </v-alert>
            <h2 class="flex text--secondary">{{message}}</h2>
            
            <v-window :value="currentLayer">
              <v-window-item :value="2">
                <div v-if="loading && !loginCode">
                  <h3 class="display-1">Please standby...</h3>
                  <v-progress-linear
                    indeterminate
                    color="accent"
                  ></v-progress-linear>
                </div>
              </v-window-item>
              <v-window-item :value="0">
                <v-form v-model="valid" v-if="!loading && !loginCode">
                  <v-text-field v-model="username" prepend-icon="person" name="username" label="Username" type="text"
                                autofocus :rules="rules" @keyup.enter="focusPassword"></v-text-field>
                  <v-text-field v-model="password" id="password" prepend-icon="lock" name="password" label="Password"
                                type="password" :rules="rules" @keyup.enter="login" ref="passWord"></v-text-field>
                </v-form>
              </v-window-item>
              <v-window-item :value="1">
                <v-container v-if="loginCode">
                  <v-layout align-center justify-center>
                    <div v-if="scannedUsername">
                      <h6 class="display-1">Welcome, please confirm:</h6>
                      <h1 class="info--text display-3">{{scannedUsername}}</h1>
                    </div>
                    <div v-else>
                      <h6 class="display-1">Your login code:</h6>
                      <h1 class="primary--text display-3">{{loginCode}}</h1>
                    </div>
                  </v-layout>
                </v-container>
              </v-window-item>
            </v-window>
            
            
            <v-layout align-center justify-center v-if="!loading && hasOauthAdapter">
              <h4>Login using</h4>
              <div>
                <div class="text-xs-center">
                  <v-btn 
                    v-for="adapter in oauthLogin.adapters" 
                    :key="adapter" 
                    round color="accent" dark 
                    :loading="oauthLogin.loading" 
                    @click="redirectOauthLogin(adapter)"
                  >
                    <v-icon v-if="$vuetify.icons.brand[adapter]">{{$vuetify.icons.brand[adapter]}}</v-icon>
                    <span v-else>{{ adapter }}</span>
                  </v-btn>
                </div>
              </div>
              
            </v-layout>
          </v-card-text>
          <v-card-actions>
            <div v-if="!oauthLogin.loading">
              <v-btn v-if="loginCode" color="info" @click="codeLoginCleanUp">With username</v-btn>
              <v-btn v-else color="secondary" @click="codeLogin">With access code</v-btn>
            </div>
            <v-spacer></v-spacer>
            <v-btn color="primary" v-on:click="login" :loading="loading" :disabled="!valid">Login</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
    <toast v-bind="toast" @showChange="changeToast" v-show="false"></toast>
  </v-container>
</template>

<script>

import meta from '@/common/config'
import utils from '../common/utils'

export default {
  data: () => ({
    loading: false,
    title: meta.title,
    toast: {
      show: false,
      text: '',
      color: ''
    },
    username: '',
    password: '',
    rules: [
      v => !!v || 'Required',
      v => (v && v.length > 4 && v.length < 20) || 'Length is not valid'
    ],
    valid: false,
    loginCode: '',
    scannedUsername: '',
    focusAt: false,
    oauthLogin: {
      loading: false,
      adapters: []
    }
  }),
  props: {
    source: String
  },
  methods: {
    login () {
      if (!this.valid) return
      this.$emit('beforeLogin')
      this.loading = true
      utils.fetchJSON(utils.apiFor('login'), 'POST', {
        username: this.username,
        password: this.password
      }, false).then(data => {
        if (!data.success) return Promise.reject(data.msg)
        this.setLoginData({
          username: this.username,
          token: data.token,
          role: data.role,
          rftoken: data.rftoken
        }).then(() => this.redirectBack())
        
      }).catch(reason => {
        this.showToast(reason, 'error')
        this.loading = false
      })
    },
    redirectBack() {
      this.$router.push(this.redirection)
    },
    showToast (text, color = 'info') {
      this.toast.show = false
      this.toast.text = text.toString()
      this.toast.color = color
      this.toast.show = true
    },
    changeToast (show) {
      this.toast.show = show
    },
    cleanUp () {
      utils.cleanRedirect()
      window.sessionStorage.removeItem('message')
    },
    setLoginData({username, ...rest}) {
      return utils.fetchJSONWithSuccess(utils.apiFor('user', 'nickname'), 'GET', {username}).then(({nickname}) => {
        utils.setLoginData({
          username,
          nickname,
          ...rest
        })
      }).catch(err => {
        utils.setLoginData({
          username,
          nickname: username,
          ...rest
        })
      })
    },
    tokenLogin (token) {
      this.loading = true
      return utils.fetchJSON(utils.apiFor('login', 'token'), 'POST', {
        token
      }, false).then(data => {
        if (!data.success) {
          return Promise.reject(data.msg)
        }
        this.setLoginData({
          username: data.payload.username,
          token,
          role: data.payload.role
        }).then(() => this.redirectBack())
      }).catch(reason => {
        this.loading = false
        this.showToast(reason, 'error')
        return Promise.reject(reason)
      }).finally(this.cleanUp)
    },
    getLoginCode () {
      return utils.fetchJSON(utils.apiFor('login', 'code', 'gen')).then(data => data.code)
    },
    codeLoginTriggers () {
      this.codeChecker = setInterval(() => {
        if (!this.loginCode) return
        utils.fetchJSON(utils.apiFor('login', 'code', this.loginCode), 'POST', {}, false).then(
          data => {
            if (!data.success) return
            let payload = data.data
            if (payload.username) {
              this.scannedUsername = payload.username
            }
            if (payload.token) {
              this.setLoginData({
                username: payload.username,
                role: payload.role,
                token: payload.token
              }).then(() => this.redirectBack())
            }
          }
        ).catch(err => {
          this.showToast(`Unstable network may affect remote login.`, 'warning')
        })
      }, 3000)
      this.codeLoginCleaner = setTimeout(() => this.codeLoginCleanUp(), 60000)
    },
    codeLogin () {
      this.loading = true
      this.loginCode = 'Loading...'
      this.getLoginCode().then(code => {
        this.loginCode = (Array(6).join('0') + code).slice(-6)
      }).then(_ => {
        this.codeLoginTriggers()
      }).catch(err => {
        // this.loginCode = 'Please retry'
        this.showToast(err, 'error')
        this.codeLoginCleanUp()
      })
    },
    codeLoginCleanUp () {
      this.codeChecker && clearInterval(this.codeChecker)
      this.codeLoginCleaner && clearTimeout(this.codeLoginCleaner)
      this.loading = false
      this.loginCode = ''
      this.scannedUsername = ''
    },
    focusPassword () {
      if (this.rules.map(r => r(this.username)).every(x => x === true)) { this.$refs.passWord.focus() }
    },
    getAdapters () {
      utils.fetchJSONWithSuccess(utils.apiFor('login', 'oauth', 'adapters')).then(adps => {
        this.oauthLogin.adapters = adps
      }).catch(err => {
        this.showToast(err, 'error')
      })
    },
    redirectOauthLogin(adapter) {
      this.oauthLogin.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('login', 'oauth', adapter, 'url'), 'GET', {
        base: window.location.href.split('?')[0],
        redirect: this.redirection
      }).then(url => {
        this.loading = true
        window.location.href = url
      }).catch(err => {
        this.oauthLogin.loading = false
        this.showToast(err, 'error')
      })
    }
  },
  computed: {
    redirection () {
      return this.$route.params.redirect || this.$route.query.redirect || utils.getRedirect() || '/'
    },
    message() {
      return window.sessionStorage.getItem('message') || this.$route.params.message || 'Login'
    },
    hasOauthAdapter () {
      return this.oauthLogin.adapters.length > 0
    },
    currentLayer () {
      const state = (!!this.loading << 1) | !!this.loginCode
      return (state & 1) || (state & 2)
    }
  },
  mounted () {
    if (utils.getLoginData()) {
      if (this.$route.params.logout) {
        utils.removeLoginData()
        this.showToast('Logged out!')
      } else {
        this.redirectBack()
      }
    }
    if (this.$route.params.alert) {
      let {color, text} = this.$route.params.alert
      this.showToast(text, color)
    }
    addEventListener('storage', e => {
      e.key === 'loginData' && e.newValue && this.redirectBack()
    })
    let token = utils.getArguments.call(this).token
    token && this.tokenLogin(token).catch(err => {
      this.getAdapters()
      this.$router.replace({
        ...this.$route,
        query: {
          ...this.$route.query,
          token: undefined
        }
      })
    })
    if (!token) {
      this.getAdapters()
    }
  },
  destroyed () {
    this.oauthLogin.loading || this.cleanUp()
    this.codeLoginCleanUp()
  }
}
</script>
