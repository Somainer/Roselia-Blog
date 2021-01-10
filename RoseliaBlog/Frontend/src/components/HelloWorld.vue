<template>
  <v-container fluid grid-list-md class="text-center fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12">
        <h3 class="display-3">Welcome to <strong class="primary--text">{{title}}</strong></h3>

        <span class="subtitle-1">{{motto}}</span>

        <v-divider class="my-3"></v-divider>
        <div v-if="loading">
          <div class="title mb-3">Please standby...</div>
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
        </div>

        <div v-else-if="isFirstRun">
          <div class="title mb-3">Add first user to continue.</div>

          <v-btn
            class="mx-0"
            color="primary"
            large
            :to="{name: 'userManagement', params: {firstRun: true}}"
          >
            Add user
          </v-btn>
        </div>

        <div v-else>
          <div class="title mb-3">Great! You are now prepared to <strong class="primary--text">{{title}}</strong></div>
          <v-btn
            class="mx-0"
            color="secondary"
            large
            :to="{name: 'index'}"
          >
            Go to {{title}}
          </v-btn>
        </div>

        </v-col>

      </v-row>
    </v-container>

</template>

<script>
import meta from '../common/config'
import utils from '../common/utils'
export default {
  name: 'HelloWorld',
  data () {
    return {
      title: meta.title,
      motto: meta.motto,
      loading: true,
      isFirstRun: false
    }
  },
  methods: {
    getFirstRunData () {
      utils.fetchJSONWithSuccess(utils.apiFor('firstrun')).then(data => {
        this.isFirstRun = true
        utils.setLoginData({
          nickname: 'Minato Yukina',
          ...data,
          su_token: undefined
        })
        utils.saveSUToken(data.su_token)
      }).finally(_ => {
        this.loading = false
      })
    }
  },
  mounted () {
    this.getFirstRunData()
  }
}
</script>

<style scoped>
</style>
