<template>
  <v-layout row wrap>
    <v-flex xs12 sm12>
      <div v-if="!isTokenExpired">
        <h1>Your token will be expired @</h1>
        <v-time-picker v-model="tokenExpiryTime" landscape readonly format="24h"></v-time-picker>
      </div>
      <div v-else>
        <h1>Your token has expired</h1>
      </div>
      
      <div v-if="userData.rftoken">
        <div v-if="!isRefreshTokenExpired">
          <h1>Your refresh token will be expired @</h1>
          <v-flex md12 lg12>
            <v-date-picker readonly v-model="rfTokenExpiryDate" color="accent" header-color="primary"></v-date-picker>
            <v-time-picker readonly v-model="rfTokenExpiryTime" color="primary" format="24h"></v-time-picker>
          </v-flex>
          <v-btn @click="refreshToken" color="primary">
            <v-icon>refresh</v-icon>Refresh
          </v-btn>
        </div>
        <div v-else>
          <h1>Your refresh token has expired</h1>
          <v-btn :to="{name: 'login', params: {logout: true}}" color="warning">
            <v-icon>exit_to_app</v-icon>Re-Login
          </v-btn>
        </div>
        
      </div>
    </v-flex>
  </v-layout>
</template>

<script>
import utils from '../../common/utils'
export default {
  props: ['userData', 'toast'],
  data() {
    return {
    }
  },
  computed: {
    tokenExpiryTime () {
      return this.getTimeOf(this.tokenExpiryDatetime)
    },
    tokenExpiryDatetime () {
      return utils.getTokenExpiryTime(this.loginToken)
    },
    rfTokenExpiryDatetime () {
      return utils.getTokenExpiryTime(this.rfToken)
    },
    rfTokenExpiryDate () {
      const date = this.rfTokenExpiryDatetime
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    },
    rfTokenExpiryTime () {
      const date = this.rfTokenExpiryDatetime
      return this.getTimeOf(date)
    },
    isRefreshTokenExpired () {
      return this.rfTokenExpiryDatetime < new Date()
    },
    isTokenExpired () {
      return this.tokenExpiryDatetime < new Date()
    },
    loginToken() {
      return this.userData.token;
    },
    rfToken() {
      return this.userData.rftoken;
    }
  },
  methods: {
    makeRedirect (to) {
      utils.setRedirect(this.$route.fullPath)
      utils.redirectTo(to)
    },
    refreshToken () {
      utils.refreshToken().then(data => {
        this.toast('+1h O..O', 'success')
        // this.loginToken = this.userData.token;
      }).catch(reason => {
        this.toast(reason, 'error')
        this.makeRedirect({name: 'login'})
      })
    },
    getTimeOf (date) {
      return `${date.getHours()}:${date.getMinutes()}`
    }
  }
  
}
</script>
