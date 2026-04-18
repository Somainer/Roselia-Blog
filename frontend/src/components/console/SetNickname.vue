<template>
  <v-container>
    <div>
      <h2 class="text--secondary">Nickname</h2>
      <v-form ref="form" v-model="valid" @submit.prevent="">
        <v-text-field
          v-model="nickname"
          name="nickname"
          label="Nickname"
          type="text"
          :rules="rules"
          @keyup.enter="changeNickname"
        ></v-text-field>
      </v-form>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" icon="mdi-check" :loading="loading" :disabled="!valid" @click="changeNickname"></v-btn>
      </v-card-actions>
    </div>

    <div>
      <h2 class="text--secondary">Motto</h2>
      <v-form @submit.prevent="">
        <v-text-field v-model="motto" name="motto" label="Motto" type="text" clearable @keyup.enter="changeMotto"></v-text-field>
      </v-form>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn v-if="motto" color="primary" icon="mdi-check" :loading="loading" @click="changeMotto"></v-btn>
        <v-btn v-else color="error" icon="mdi-minus-circle" :loading="loading" @click="changeMotto"></v-btn>
      </v-card-actions>
    </div>

    <div>
      <h2 class="text--secondary">Avatar</h2>
      <v-form ref="formA" v-model="avatarValid" @submit.prevent="">
        <v-text-field
          v-model="avatar"
          name="avatar"
          label="Avatar Image URL"
          type="text"
          clearable
          @keyup.enter="changeAvatar(false)"
        ></v-text-field>
      </v-form>
      <v-card-actions>
        <div v-if="avatar">
          <v-avatar size="64" class="elevation-7">
            <img :src="avatar" @load="avatarValid = true" />
          </v-avatar>
          <br /><br />
        </div>
        <v-btn v-else color="error" icon="mdi-minus-circle" :loading="loading" @click="changeAvatar(true)"></v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" icon="mdi-check" :loading="loading" :disabled="!avatar || !avatarValid" @click="changeAvatar"></v-btn>
      </v-card-actions>
    </div>

    <div>
      <h2 class="text--secondary">Banner Image</h2>
      <v-form>
        <v-text-field
          v-model="banner"
          name="banner"
          label="Banner Image URL"
          type="text"
          clearable
          @keyup.enter="changeBanner(false)"
        ></v-text-field>
      </v-form>
      <div>
        <v-img v-if="banner" :src="banner" @load="bannerValid = true"></v-img>
        <v-btn v-else color="error" icon="mdi-minus-circle" :loading="loading" @click="changeBanner(true)"></v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" icon="mdi-check" :loading="loading" :disabled="!banner || !bannerValid" @click="changeBanner"></v-btn>
      </div>
    </div>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import utils from '../../common/utils'

export default defineComponent({
  name: 'set-nickname',
  props: {
    userData: { type: Object as PropType<any>, required: true },
    toast: { type: Function as PropType<(text: string, color?: string) => void>, required: true }
  },
  data() {
    return {
      nickname: '',
      avatar: '',
      banner: '',
      motto: '',
      loading: false,
      rules: [(v: string) => !!v || 'Required'],
      valid: false,
      avatarValid: false,
      bannerValid: false
    }
  },
  watch: {
    avatar() { this.avatarValid = false },
    banner() { this.bannerValid = false }
  },
  mounted() {
    this.getUserMeta()
  },
  methods: {
    changeNickname() {
      if (!this.valid) return
      return this.changeInfo('nickname', this.nickname).then(() => {
        this.userData.nickname = this.nickname
        utils.updateLoginData((d: any) => ({ ...d, nickname: this.nickname }))
        this.nickname = ''
      })
    },
    changeMotto() {
      return this.changeInfo('motto', this.motto)
    },
    changeAvatar(force = false) {
      if (!force && (!this.avatarValid || !this.avatar)) return
      return this.changeInfo('avatar', this.avatar).then(() => { this.avatar = '' })
    },
    changeBanner(force = false) {
      if (!force && (!this.bannerValid || !this.banner)) return
      return this.changeInfo('banner', this.banner).then(() => { this.banner = '' })
    },
    changeInfo(key: string, value: string) {
      this.loading = true
      return utils.fetchJSONWithSuccess(utils.apiFor('user', 'change-meta'), 'POST', {
        changes: { [key]: value }
      }).then((result: any) => {
        this.toast(`Your ${key} has changed!`, 'success')
        this.loading = false
        return result
      }).catch((err: any) => {
        this.loading = false
        this.toast('Emmm... Something is strange', 'error')
        return Promise.reject(err)
      })
    },
    getUserMeta() {
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'user-meta'), 'GET', {
        username: this.userData.username
      }).then((data: any) => {
        this.loading = false
        this.nickname = data.nickname
        this.avatar = data.avatar
        this.banner = data.banner || ''
        this.motto = data.motto || ''
      }).catch((err: any) => {
        this.loading = false
        this.toast(err, 'error')
      })
    }
  }
})
</script>
