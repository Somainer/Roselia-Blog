<template>
  <v-card-action>
    <h2 class="flex text--secondary">Set Nickname</h2>
    <v-form v-model="valid" ref="form" @submit.prevent="">
      <v-text-field v-model="nickname" name="nickname" label="Nickname" type="text"
                    autofocus :rules="rules" @keyup.enter="changeNickname"></v-text-field>
    </v-form>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="primary" v-on:click="changeNickname" :loading="loading" :disabled="!valid">Set</v-btn>
    </v-card-actions>
  </v-card-action>
</template>

<script>
import utils from '../../common/utils'
export default {
  name: 'remote-login',
  props: ['userData', 'toast'],
  data () {
    return {
      nickname: '',
      loading: false,
      rules: [
        v => !!v || 'Required'
      ],
      valid: false
    }
  },
  methods: {
    changeNickname() {
      if(!this.valid) return
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'set-nickname'), 'POST', {nickname: this.nickname}).then(_ => {
          this.toast('Your nickname has changed!', 'success')
          this.userData.nickname = this.nickname
          utils.updateLoginData(d => ({
              ...d,
              nickname: this.nickname
          }))
          this.loading = false
      }).catch(_ => {
        this.loading = false
        this.toast('Emmm... Something is strange', 'error')
      })
    }
  }
}
</script>

<style scoped>

</style>
