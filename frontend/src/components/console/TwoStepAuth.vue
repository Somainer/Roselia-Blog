<template>
  <div>
    <h2 class="text--secondary">Two Step Auth</h2>
    <div v-if="enabled">
      <h3>You have enabled two step auth!</h3>
      <div v-if="totpCode">
        <v-alert type="warning">Please make sure to keep this because it will display only once.</v-alert>
        <h4>Account: {{ userData.username }}</h4>
        <h4>Code: {{ totpCode }}</h4>
        <p>
          <v-btn size="small" rounded :href="totpUri" color="primary">Bind Now</v-btn>
          <v-btn size="small" rounded color="primary" @click="downloadAuthFile">Save</v-btn>
        </p>
        <vue-qrcode :value="totpUri"></vue-qrcode>
      </div>
      <v-btn color="warning" @click="handleDelete">Disable</v-btn>
    </div>
    <div v-else>
      <h3>Two step auth is disabled</h3>
      <v-btn @click="enableTwoStepAuth">Enable</v-btn>
    </div>
    <v-card-actions>
      <v-spacer></v-spacer>
    </v-card-actions>
    <v-dialog v-model="dialog" persistent max-width="500">
      <v-card>
        <v-card-title class="text-h5">You need to confirm by typing code.</v-card-title>
        <v-container>
          <v-form ref="form" v-model="valid" @submit.prevent="">
            <v-text-field
              v-model="authCode"
              name="loginCode"
              label="Auth Code"
              type="number"
              autofocus
              :rules="rules"
              @keyup.enter="removeTwoStepAuth"
            ></v-text-field>
          </v-form>
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="dialog = false">Nope</v-btn>
          <v-btn color="info" variant="text" @click="removeTwoStepAuth">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import utils from '../../common/utils'
import VueQrcode from '@chenfengyuan/vue-qrcode'

export default defineComponent({
  name: 'two-step-auth',
  components: { VueQrcode: VueQrcode as any },
  props: {
    userData: { type: Object as PropType<any>, required: true },
    toast: { type: Function as PropType<(text: string, color?: string) => void>, required: true }
  },
  data() {
    return {
      enabled: false,
      dialog: false,
      totpCode: '',
      totpUri: '',
      authCode: '',
      nextCode: '',
      valid: false,
      rules: [(v: string) => !!v || 'Required']
    }
  },
  mounted() {
    this.checkTwoStepAuth()
  },
  methods: {
    enableTwoStepAuth() {
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'two-step-auth', 'bind'), 'POST', {}).then((result: any) => {
        this.totpUri = result.url
        this.totpCode = result.code
        this.nextCode = result.nextCode
        this.enabled = true
      }).catch(() => this.toast('Oops, try again.', 'error'))
    },
    checkTwoStepAuth() {
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'user-meta'), 'GET', {
        username: this.userData.username
      }).then((user: any) => {
        this.enabled = user.totp
      }).catch(() => this.toast('Oops!', 'error'))
    },
    removeTwoStepAuth() {
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'two-step-auth', 'remove'), 'POST', {
        code: this.nextCode || this.authCode
      }).then(() => {
        this.toast('Great! You are unsafe now!', 'success')
        this.enabled = false
        this.dialog = false
      }).catch(() => {
        if (this.nextCode) {
          this.nextCode = ''
          this.dialog = true
          return
        }
        this.toast('Somehow your code is wrong.', 'error')
      })
    },
    handleDelete() {
      if (this.nextCode) return this.removeTwoStepAuth()
      this.dialog = true
    },
    downloadAuthFile() {
      const content = `
      Account: ${this.userData.username}
      Key: ${this.totpCode},
      BindURL: ${this.totpUri}
      `.split('\n').map(s => s.trim()).join('\n')
      const blob = new Blob([content])
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${this.userData.username} - Roselia Blog.txt`
      link.href = url
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 4e4)
    }
  }
})
</script>
