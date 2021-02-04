<template>
<v-container>
  <div>
    <h2 class="flex text--secondary">Nickname</h2>
    <v-form v-model="valid" ref="form" @submit.prevent="">
      <v-text-field v-model="nickname" name="nickname" label="Nickname" type="text"
                    :rules="rules" @keyup.enter="changeNickname"></v-text-field>
    </v-form>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="primary" v-on:click="changeNickname" :loading="loading" :disabled="!valid">
        <v-icon>check</v-icon>
      </v-btn>
    </v-card-actions>
  </div>
  <div>
    <h2 class="flex text--secondary">Motto</h2>
    <v-form @submit.prevent="">
      <v-text-field v-model="motto" name="motto" label="Motto" type="text"
                    clearable @keyup.enter="changeMotto"></v-text-field>
    </v-form>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn v-if="motto" color="primary" v-on:click="changeMotto" :loading="loading">
        <v-icon>check</v-icon>
      </v-btn>
      <v-btn v-else color="error" @click="changeMotto" :loading="loading">
        <v-icon>remove_circle</v-icon>
      </v-btn>
    </v-card-actions>
  </div>

  <div>
    <h2 class="flex text--secondary">Avatar</h2>
    <v-form v-model="avatarValid" ref="formA" @submit.prevent="">
      <v-text-field v-model="avatar" name="avatar" label="Avatar Image URL" type="text"
                    clearable @keyup.enter="changeAvatar(false)"></v-text-field>
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
  </div>
  <div>
    <h2 class="flex text--secondary">Banner Image</h2>
    <v-form>
      <v-text-field v-model="banner" name="banner" label="Banner Image URL" type="text"
                    clearable @keyup.enter="changeBanner(false)"></v-text-field>
    </v-form>
    <div>
      <v-img v-if="banner" :src="banner" @load="bannerValid = true"></v-img>
      <v-btn v-else color="error" @click="changeBanner(true)" :loading="loading">
        <v-icon>remove_circle</v-icon>
      </v-btn>

      <v-spacer></v-spacer>
      <v-btn color="primary" v-on:click="changeBanner" :loading="loading" :disabled="!banner || !bannerValid">
        <v-icon>check</v-icon>
      </v-btn>
    </div>
  </div>
</v-container>
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
      banner: '',
      motto: '',
      loading: false,
      rules: [
        v => !!v || 'Required'
      ],
      valid: false,
      avatarValid: false,
      bannerValid: false
    }
  },
  methods: {
    performChangeUserMeta(key, value) {
      this.loading = true
      return utils.fetchJSONWithSuccess(utils.apiFor('user', 'change-meta'), 'POST', {
        changes: {
          [key]: value
        }
      }).then(resp => {
        this.loading = false
        return resp
      }).catch(err => {
        this.loading = false
        return Promise.reject(err)
      })
    },
    changeNickname() {
      if(!this.valid) return
      this.loading = true
      return this.changeInfo('nickname', this.nickname).then(_ => {
        this.userData.nickname = this.nickname
        utils.updateLoginData(d => ({
            ...d,
            nickname: this.nickname
        }))
        this.nickname = ''
      })
    },
    changeMotto() {
      return this.changeInfo('motto', this.motto)
    },
    changeAvatar(force = false) {
      if(!force && (!this.avatarValid || !this.avatar)) return;
      return this.changeInfo('avatar', this.avatar).then(_ => {
        this.avatar = ''
      })
    },
    changeBanner(force = false) {
      if(!force && (!this.bannerValid || !this.banner)) return;
      return this.changeInfo('banner', this.banner).then(_ => {
        this.banner = ''
      })
    },
    changeInfo(key, value) {
      this.loading = true
      return utils.fetchJSONWithSuccess(utils.apiFor('user', 'change-meta'), 'POST', {
        changes: {
          [key]: value || ''
        }
      }).then(result => {
          this.toast(`Your ${key} has changed!`, 'success')
          this.loading = false
          return result
      }).catch(err => {
        this.loading = false
        this.toast('Emmm... Something is strange', 'error')
        return Promise.reject(err)
      })
    },
    getUserMeta() {
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'user-meta'), 'GET', {
        username: this.userData.username
      }).then(data => {
        this.loading = false
        this.nickname = data.nickname
        this.avatar = data.avatar
        this.banner = data.banner || ''
        this.motto = data.motto || ''
      }).catch(err => {
        this.loading = false
        this.toast(err, 'error')
      })
    }
  },
  watch: {
    avatar() {
      this.avatarValid = false
    },
    banner() {
      this.bannerValid = false
    }
  },
  mounted() {
    this.getUserMeta()
  }
}
</script>

<style scoped>

</style>
