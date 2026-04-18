<template>
  <v-row>
    <v-col cols="12">
      <div v-if="!isTokenExpired">
        <h1>Your token will be expired @</h1>
        <p class="text-h6">{{ tokenExpiryTime }}</p>
      </div>
      <div v-else>
        <h1>Your token has expired</h1>
      </div>

      <div v-if="userData.rftoken">
        <div v-if="!isRefreshTokenExpired">
          <h1>Your refresh token will be expired @</h1>
          <p class="text-h6">{{ rfTokenExpiryDate }} {{ rfTokenExpiryTime }}</p>
          <v-btn color="primary" @click="refreshToken">
            <v-icon>mdi-refresh</v-icon>Refresh
          </v-btn>
        </div>
        <div v-else>
          <h1>Your refresh token has expired</h1>
          <v-btn :to="{ name: 'login', params: { logout: true } }" color="warning">
            <v-icon>mdi-logout</v-icon>Re-Login
          </v-btn>
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import utils from '../../common/utils'

export default defineComponent({
  name: 'token-refresh',
  props: {
    userData: { type: Object as PropType<any>, required: true },
    toast: { type: Function as PropType<(text: string, color?: string) => void>, required: true }
  },
  computed: {
    tokenExpiryTime(): string { return this.getTimeOf(this.tokenExpiryDatetime) },
    tokenExpiryDatetime(): Date { return utils.getTokenExpiryTime(this.loginToken) },
    rfTokenExpiryDatetime(): Date { return utils.getTokenExpiryTime(this.rfToken) },
    rfTokenExpiryDate(): string {
      const date = this.rfTokenExpiryDatetime
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    },
    rfTokenExpiryTime(): string { return this.getTimeOf(this.rfTokenExpiryDatetime) },
    isRefreshTokenExpired(): boolean { return this.rfTokenExpiryDatetime < new Date() },
    isTokenExpired(): boolean { return this.tokenExpiryDatetime < new Date() },
    loginToken(): string { return this.userData.token },
    rfToken(): string { return this.userData.rftoken }
  },
  methods: {
    makeRedirect(to: any) {
      utils.setRedirect(this.$route.fullPath)
      utils.redirectTo(to)
    },
    refreshToken() {
      utils.refreshToken().then(() => {
        this.toast('+1h O..O', 'success')
      }).catch((reason: any) => {
        this.toast(reason, 'error')
        this.makeRedirect({ name: 'login' })
      })
    },
    getTimeOf(date: Date): string {
      return `${date.getHours()}:${date.getMinutes()}`
    }
  }
})
</script>
