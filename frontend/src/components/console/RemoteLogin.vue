<template>
  <div>
    <h2 class="text--secondary">Remote Login</h2>
    <v-form ref="form" v-model="valid" @submit.prevent="">
      <v-text-field
        v-model="loginCode"
        name="loginCode"
        label="Login Code"
        type="number"
        autofocus
        :rules="rules"
        @keyup.enter="scanCode"
      ></v-text-field>
    </v-form>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="primary" :loading="loading" :disabled="!valid" @click="scanCode">Login</v-btn>
    </v-card-actions>
    <v-dialog v-model="dialog" persistent max-width="500">
      <v-card>
        <v-card-title class="text-h5">Remote Login</v-card-title>
        <v-card-text>Will login at {{ loginMeta.os }} {{ loginMeta.browser }} device on {{ loginMeta.ip }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="dialog = false">Nope</v-btn>
          <v-btn color="info" variant="text" @click="confirmCode">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import utils from '../../common/utils'

export default defineComponent({
  name: 'remote-login',
  props: {
    userData: { type: Object as PropType<any>, default: null },
    toast: { type: Function as PropType<(text: string, color?: string) => void>, required: true }
  },
  data() {
    return {
      loginCode: '',
      valid: false,
      loading: false,
      rules: [
        (v: string) => !!v || 'Required',
        (v: string) => [].every.call(v, (x: any) => !isNaN(parseInt(x))) || 'Code should be digits',
        (v: string) => (v && v.length === 6) || 'Length should be 6'
      ],
      dialog: false,
      loginMeta: { os: '', browser: '', ip: '' }
    }
  },
  watch: {
    dialog(to: boolean) {
      if (!to) this.loading = false
    }
  },
  methods: {
    async scanCode() {
      const form = this.$refs.form as any
      const { valid } = (await form?.validate?.()) || { valid: this.valid }
      if (!valid) return
      this.loading = true
      utils.fetchJSON(utils.apiFor('login', 'code', 'scan', this.loginCode), 'POST').then((data: any) => {
        if (!data.success) {
          this.toast(data.msg, 'error')
          this.loading = false
          return
        }
        this.loginMeta = data.msg
        this.dialog = true
        this.loading = false
      }).catch(() => {
        this.loading = false
        this.toast('Network error.', 'error')
      })
    },
    confirmCode() {
      this.loading = true
      utils.fetchJSON(utils.apiFor('login', 'code', 'confirm', this.loginCode), 'POST').then((data: any) => {
        if (!data.success) this.toast(data.msg, 'error')
        this.toast('I assume that you are teleported to another device', 'success')
        this.dialog = false
        utils.redirectTo({ name: 'userspace' })
      }).catch(() => this.toast('Network error', 'error'))
    }
  }
})
</script>
