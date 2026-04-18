<template>
  <div>
    <h2 class="text--secondary">Change Password for {{ userData.username }}</h2>
    <v-form ref="form" v-model="valid">
      <v-text-field
        v-model="oldPassword"
        name="oldPassword"
        label="Old Password"
        type="password"
        autofocus
        :rules="rules"
      ></v-text-field>
      <v-text-field
        v-model="newPassword"
        name="newPassword"
        label="New Password"
        type="password"
        :rules="rules"
      ></v-text-field>
      <v-text-field
        v-model="repeatPassword"
        name="repeatPassword"
        label="Repeat Password"
        type="password"
        :rules="repeatRules"
      ></v-text-field>
    </v-form>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="warning" :loading="loading" :disabled="!valid" @click="changePassword">Change</v-btn>
    </v-card-actions>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import utils from '../../common/utils'

const rules = [
  (v: string) => !!v || 'Required',
  (v: string) => (v && v.length > 4 && v.length < 20) || 'Length is not valid'
]

export default defineComponent({
  name: 'change-password',
  props: {
    userData: { type: Object as PropType<any>, required: true },
    toast: { type: Function as PropType<(text: string, color?: string) => void>, required: true }
  },
  data() {
    return {
      loading: false,
      oldPassword: '',
      newPassword: '',
      repeatPassword: '',
      valid: false,
      rules,
      repeatRules: rules.concat([
        (v: string) => v === this.newPassword || 'Repeat password should equal to new password'
      ] as any)
    }
  },
  methods: {
    async changePassword() {
      const form = this.$refs.form as any
      const { valid } = (await form.validate()) || { valid: this.valid }
      if (!valid) return
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'change'), 'POST', {
        username: this.userData.username,
        oldPassword: this.oldPassword,
        newPassword: this.newPassword
      }, false).then(() => {
        this.toast('Success!', 'success')
        this.$router.go(-1)
      }).catch((reason: any) => {
        this.toast(reason, 'error')
      }).finally(() => {
        this.loading = false
      })
    }
  }
})
</script>
