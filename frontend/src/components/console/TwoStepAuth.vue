<template>
  <v-card-action>
    <h2 class="flex text--secondary">Two Step Auth</h2>
    <div v-if="enabled">
      <h3>You have enabled two step auth!</h3>
      <div v-if="totpCode">
        <v-alert type="warning" :value="true">
          Please make sure to keep this because it will display only once.
        </v-alert>
        <h4>Account: {{ userData.username }}</h4>
        <h4>Code: {{ totpCode }}</h4>
        <p>
          <v-btn small round :href="totpUri" color="primary">Bind Now</v-btn>
          <v-btn small round @click="downloadAuthFile" color="primary">Save</v-btn>
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
        <v-card-title class="headline">You need to confirm by typing code.</v-card-title>
        <v-container>

          <v-form v-model="valid" ref="form" @submit.prevent="">
            <v-text-field v-model="authCode" name="loginCode" label="Auth Code" type="number"
                          autofocus :rules="rules" @keyup.enter="removeTwoStepAuth"></v-text-field>
          </v-form>
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" flat @click.native="dialog = false">Nope</v-btn>
          <v-btn color="info" flat @click="removeTwoStepAuth">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card-action>
</template>
<script>
import utils from '../../common/utils'
import VueQrcode from '@chenfengyuan/vue-qrcode'
export default {
  components: {VueQrcode},
  props: ['userData', 'toast'],
  data() {
    return {
      enabled: false,
      dialog: false,
      totpCode: '',
      totpUri: '',
      authCode: '',
      nextCode: ''
    }
  },
  methods: {
    enableTwoStepAuth() {
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'two-step-auth', 'bind'), 'POST', {}).then(result => {
        this.totpUri = result.url
        this.totpCode = result.code
        this.nextCode = result.nextCode
        this.enabled = true
      }).catch(err => {
        this.toast('Oops, try again.', 'error')
      })
    },
    checkTwoStepAuth() {
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'user-meta'), 'GET', {username: this.userData.username}).then(user => {
        this.enabled = user.totp
      }).catch(err => {
        this.toast('Oops!', 'error')
      })
    },
    removeTwoStepAuth() {
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'two-step-auth', 'remove'), 'POST', {code: this.nextCode || this.authCode}).then(result => {
        this.toast('Great! You are unsafe now!', 'success')
        this.enabled = false
        this.dialog = false
      }).catch(err => {
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
  },
  mounted() {
    this.checkTwoStepAuth()
  }
}
</script>

