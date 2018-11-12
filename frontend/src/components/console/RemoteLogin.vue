<template>
  <v-card-action>
    <h2 class="flex text--secondary">Remote Login</h2>
    <v-form v-model="valid" ref="form" @submit.prevent="">
      <v-text-field v-model="loginCode" name="loginCode" label="Login Code" type="number"
                    autofocus :rules="rules" @keyup.enter="scanCode"></v-text-field>
    </v-form>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="primary" v-on:click="scanCode" :loading="loading" :disabled="!valid">Login</v-btn>
    </v-card-actions>
    <v-dialog v-model="dialog" persistent max-width="500">
      <v-card>
        <v-card-title class="headline">Remote Login</v-card-title>
        <v-card-text>Will login at {{loginMeta.os}} {{loginMeta.browser}} device on {{loginMeta.ip}}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" flat @click.native="dialog = false">Nope</v-btn>
          <v-btn color="info" flat @click="confirmCode">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card-action>
</template>

<script>
import utils from '../../common/utils'
export default {
  name: 'remote-login',
  props: ['userData', 'toast'],
  data () {
    return {
      loginCode: '',
      valid: false,
      loading: false,
      rules: [
        v => !!v || 'Required',
        v => [].every.call(v, x => !isNaN(parseInt(x))) || 'Code should be digits',
        v => (v && v.length === 6) || 'Length should be 6'
      ],
      dialog: false,
      loginMeta: {
        os: '',
        browser: '',
        ip: ''
      }
    }
  },
  methods: {
    scanCode () {
      if (this.$refs.form.validate()) {
        this.loading = true
        utils.fetchJSON(utils.apiFor('login', 'code', 'scan', this.loginCode), 'POST').then(data => {
          if (!data.success) {
            this.toast(data.msg, 'error')
            this.loading = false
            return
          }
          this.loginMeta = data.msg
          this.dialog = true
          this.loading = false
        }).catch(_ => {
          this.loading = false
          this.toast('Network error.', 'error')
        })
      }
    },
    confirmCode () {
      this.loading = true
      utils.fetchJSON(utils.apiFor('login', 'code', 'confirm', this.loginCode), 'POST').then(data => {
        if (!data.success) {
          this.toast(data.msg, 'error')
        }
        this.toast('I assume that you are teleported to another device', 'success')
        this.dialog = false
        utils.redirectTo({
          name: 'userspace'
        })
      }).catch(_ => { this.toast('Network error', 'error') })
    }
  },
  watch: {
    dialog (to) {
      if (!to) this.loading = false
    }
  }
}
</script>

<style scoped>

</style>
