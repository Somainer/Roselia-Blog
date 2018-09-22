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
            <h2 class="flex text--secondary">{{message}}</h2>
            <h3 v-if="loading && !loginCode" class="display-1">Loading...</h3>
            <v-form v-model="valid" v-if="!loading && !loginCode">
              <v-text-field v-model="username" prepend-icon="person" name="username" label="Username" type="text"
                            autofocus :rules="rules" @keyup.enter="focusPassword"></v-text-field>
              <v-text-field v-model="password" id="password" prepend-icon="lock" name="password" label="Password"
                            type="password" :rules="rules" @keyup.enter="login" ref="passWord"></v-text-field>
            </v-form>
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
          </v-card-text>
          <v-card-actions>
            <v-btn v-if="loginCode" color="info" @click="codeLoginCleanUp">With username</v-btn>
            <v-btn v-else color="secondary" @click="codeLogin">With access code</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" v-on:click="login" :loading="loading" :disabled="!valid">Login</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
    <toast v-bind="toast" @showChange="changeToast"></toast>
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
    focusAt: false
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
        utils.setLoginData({
          username: this.username,
          token: data.token,
          role: data.role,
          rftoken: data.rftoken
        })
        utils.redirectTo(this.redirection)
      }).catch(reason => {
        this.showToast(reason, 'error')
        this.loading = false
      })
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
    tokenLogin (token) {
      this.loading = true
      utils.fetchJSON(utils.apiFor('login', 'token'), 'POST', {
        token
      }, false).then(data => {
        if (!data.success) {
          return Promise.reject(data.msg)
        }
        utils.setLoginData({
          username: data.payload.username,
          token,
          role: data.payload.role
        })
        utils.redirectTo(this.redirection)
      }).catch(reason => {
        this.loading = false
        this.showToast(reason, 'error')
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
              utils.setLoginData({
                username: payload.username,
                role: payload.role,
                token: payload.token
              })
              utils.redirectTo(this.redirection)
            }
          }
        )
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
      }).catch(_ => {
        this.loginCode = 'Please retry'
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
    }
  },
  computed: {
    redirection () {
      return this.$route.params.redirect || this.$route.query.redirect || utils.getRedirect() || '/'
    },
    message() {
      return window.sessionStorage.getItem('message') || this.$route.params.message || 'Login'
    }
  },
  mounted () {
    if (utils.getLoginData()) {
      if (this.$route.params.logout) {
        utils.removeLoginData()
        this.showToast('Logged out!')
      } else {
        utils.redirectTo(this.redirection)
      }
    }
    addEventListener('storage', e => {
      e.key === 'loginData' && e.newValue && utils.redirectTo(this.redirection)
    })
    let token = utils.getArguments.call(this).token
    token && this.tokenLogin()
  },
  destroyed () {
    this.cleanUp()
    this.codeLoginCleanUp()
  }
}
</script>