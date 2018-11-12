<template>
  <v-card-action>
    <h2 class="flex text--secondary">Change Password for {{userData.username}}</h2>
    <v-form v-model="valid" ref="form">
      <v-text-field v-model="oldPassword" name="oldPassword" label="Old Password" type="password"
                    autofocus :rules="rules"></v-text-field>
      <v-text-field v-model="newPassword" name="newPassword" label="New Password"
                    type="password" :rules="rules"></v-text-field>
      <v-text-field v-model="repeatPassword" name="repeatPassword" label="Repeat Password"
                    type="password" :rules="repeatRules"></v-text-field>
    </v-form>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="warning" v-on:click="changePassword" :loading="loading" :disabled="!valid">Change</v-btn>
    </v-card-actions>
  </v-card-action>

</template>

<script>
import utils from '../../common/utils'
const rules = [
  v => !!v || 'Required',
  v => (v && v.length > 4 && v.length < 20) || 'Length is not valid'
]
export default {
  name: 'change-password',
  props: ['userData', 'toast'],
  data () {
    return {
      loading: false,
      oldPassword: '',
      newPassword: '',
      repeatPassword: '',
      valid: false,
      rules,
      repeatRules: rules.concat([
        v => v === this.newPassword || 'Repeat password should equal to new password'
      ])
    }
  },
  methods: {
    changePassword () {
      if (this.$refs.form.validate()) {
        this.loading = true
        utils.fetchJSONWithSuccess(utils.apiFor('user', 'change'), 'POST', {
          username: this.userData.username,
          oldPassword: this.oldPassword,
          newPassword: this.newPassword
        }, false).then(data => {
          this.toast('Success!', 'success')
          this.$router.go(-1)
        }).catch(reason => {
          this.toast(reason, 'error')
        }).finally(_ => {
          this.loading = false
        })
      }
    }
  }
}
</script>

<style scoped>

</style>
