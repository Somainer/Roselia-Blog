<template>
  <v-container fluid class="text-center fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12">
        <h3 class="text-h3">Welcome to <strong class="text-primary">{{title}}</strong></h3>

        <span class="text-subtitle-1">{{motto}}</span>

        <v-divider class="my-3"></v-divider>
        <div v-if="loading">
          <div class="text-h6 mb-3">Please standby...</div>
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <div v-else-if="isFirstRun">
          <div class="text-h6 mb-3">Add first user to continue.</div>
          <v-btn class="mx-0" color="primary" size="large" :to="{name: 'userManagement', params: {firstRun: true}}">
            Add user
          </v-btn>
        </div>

        <div v-else>
          <div class="text-h6 mb-3">Great! You are now prepared to <strong class="text-primary">{{title}}</strong></div>
          <v-btn class="mx-0" color="secondary" size="large" :to="{name: 'index'}">
            Go to {{title}}
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import meta from '../common/config'
import utils from '../common/utils'

export default defineComponent({
  name: 'HelloWorld',
  data() {
    return {
      title: meta.title,
      motto: meta.motto,
      loading: true,
      isFirstRun: false
    }
  },
  methods: {
    getFirstRunData() {
      utils.fetchJSONWithSuccess(utils.apiFor('firstrun')).then((data: any) => {
        this.isFirstRun = true
        utils.setLoginData({
          nickname: 'Minato Yukina',
          ...data,
          su_token: undefined
        })
        utils.saveSUToken(data.su_token)
      }).finally(() => {
        this.loading = false
      })
    }
  },
  mounted() {
    this.getFirstRunData()
  }
})
</script>
