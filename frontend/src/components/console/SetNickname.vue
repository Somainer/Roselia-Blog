<template>
<div>
  <v-card-action>
    <h2 class="flex text--secondary">Set Nickname</h2>
    <v-form v-model="valid" ref="form" @submit.prevent="">
      <v-text-field v-model="nickname" name="nickname" label="Nickname" type="text"
                    autofocus :rules="rules" @keyup.enter="changeNickname"></v-text-field>
    </v-form>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="primary" v-on:click="changeNickname" :loading="loading" :disabled="!valid">
        <v-icon>check</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card-action>

  <v-card-action>
    <h2 class="flex text--secondary">Set Avatar</h2>
    <v-form v-model="avatarValid" ref="formA" @submit.prevent="">
      <v-text-field v-model="avatar" name="avatar" label="Avatar Image URL" type="text"
                    @keyup.enter="changeAvatar(false)"></v-text-field>
    </v-form>
    <v-card-actions>
      <div v-if="avatar">
        <v-avatar
          size="64px"
          class="elevation-7"
        >
          <img
            :src="avatar"
            @load="avatarValid = true"
          />
        </v-avatar>
        <br/><br/>
      </div>
      <v-btn v-else color="error" @click="changeAvatar(true)" :loading="loading">
        <v-icon>remove_circle</v-icon>
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn color="primary" v-on:click="changeAvatar" :loading="loading" :disabled="!avatar || !avatarValid">
        <v-icon>check</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card-action>
</div>
</template>

<script>
import utils from '../../common/utils'
export default {
  name: 'remote-login',
  props: ['userData', 'toast'],
  data () {
    return {
      nickname: '',
      avatar: '',
      loading: false,
      rules: [
        v => !!v || 'Required'
      ],
      valid: false,
      avatarValid: false
    }
  },
  methods: {
    changeNickname() {
      if(!this.valid) return
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'change-meta'), 'POST', {
        changes: {
          nickname: this.nickname
        }
      }).then(_ => {
          this.toast('Your nickname has changed!', 'success')
          this.userData.nickname = this.nickname
          utils.updateLoginData(d => ({
              ...d,
              nickname: this.nickname
          }))
          this.loading = false
          this.nickname = ''
      }).catch(_ => {
        this.loading = false
        this.toast('Emmm... Something is strange', 'error')
      })
    },
    changeAvatar(force = false) {
      if(!force && (!this.avatarValid || !this.avatar)) return;
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'change-meta'), 'POST', {
        changes: {
          avatar: this.avatar
        }
      }).then(_ => {
          this.toast('Your avatar has changed!', 'success')
          this.loading = false
          this.avatar = ''
      }).catch(_ => {
        this.loading = false
        this.toast('Emmm... Something is strange', 'error')
      })
    }
  },
  watch: {
    avatar() {
      this.avatarValid = false
    }
  }
}
</script>

<style scoped>

</style>
