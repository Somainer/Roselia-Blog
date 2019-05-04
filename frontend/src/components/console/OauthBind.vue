<template>
  <v-container 
    fluid
    grid-list-md
  >
    <v-layout row wrap>
      <v-flex xs12>
        <h2>OAuth Accounts</h2>
      </v-flex>
      <v-card-actions>
        <v-flex
          v-for="{adapter, isBound, bindUser} in adapterList" 
          :key="adapter"
         >
          <v-btn 
            v-if="!isBound"
            round color="accent" dark 
            @click="goToBind(adapter)"
            :loading="loading"
          >
            <v-icon v-if="$vuetify.icons.brand[adapter]">{{$vuetify.icons.brand[adapter]}}</v-icon>
            <span v-else>{{ adapter }}</span>
          </v-btn>
          <div v-else>
            <v-icon v-if="$vuetify.icons.brand[adapter]">{{$vuetify.icons.brand[adapter]}}</v-icon>
            <span v-else>{{ adapter }}</span>
            :
            <span>{{ bindUser }}</span>
            <v-btn icon small flat color="error" @click="removeAdapter(adapter)">
              <v-icon>clear</v-icon>
            </v-btn>
          </div>
        </v-flex>
      </v-card-actions>
    </v-layout>
    
  </v-container>
</template>

<script>
import utils from '../../common/utils'
import {tupleToDict} from '../../common/helpers'
export default {
  props: ['userData', 'toast'],
  data() {
    return {
      loading: false,
      adapters: [],
      myAdapters: [] // => {adapter. user}[]
    }
  },
  methods: {
    getAdapters() {
      utils.fetchJSONWithSuccess(utils.apiFor('login', 'oauth', 'adapters')).then(adps => {
        this.adapters = adps
      }).catch(err => {
        this.toast(err, 'error')
      })
    },
    getMyAdapters() {
      utils.fetchJSONWithSuccess(utils.apiFor('oauth', 'list-bind-adapters')).then(myAdps => {
        this.myAdapters = myAdps
      }).catch(err => {
        this.toast(err, 'error')
      })
    },
    mergeAvailableAdapters() {
      const adapterDict = tupleToDict(this.adapters.map(s => [s, {
        adapter: s,
        isBound: false,
        bindUser: null
      }]))
      this.myAdapters.forEach(({adapter, user}) => {
        if(adapterDict[adapter]) {
          adapterDict[adapter] = {
            ...adapterDict[adapter],
            isBound: true,
            bindUser: user
          }
        }
      })
      return Object.values(adapterDict)
    },
    goToBind(adapter) {
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('oauth', 'bind', adapter, 'url')).then(url => {
        this.toast(`We are now going to ${adapter}...`, 'info')
        location.href = url
      }).catch(err => {
        this.loading = false
        this.toast('Oops! Failed.', 'error')
      })
    },
    removeAdapter(adapter) {
      utils.fetchJSONWithSuccess(utils.apiFor('oauth', 'remove-adapter', adapter), 'POST').then(() => {
        this.myAdapters = this.myAdapters.filter(d => d.adapter !== adapter)
        this.toast('Account Removed', 'success')
      }).catch(err => {
        this.toast('Something is strange', 'error')
      })
    }
  },
  computed: {
    adapterList() {
      return this.mergeAvailableAdapters()
    }
  },
  mounted() {
    this.getAdapters()
    this.getMyAdapters()
    if(this.$route.query.succeed || this.$route.query.error) {
      const {succeed, error} = this.$route.query
      this.$router.replace({
        ...this.$route,
        query: {
          ...this.$route.query,
          succeed: undefined,
          error: undefined
        },
        params: {
          ...this.$route.params,
          succeed,
          error
        }
      })
    }
    if(this.$route.params.succeed || this.$route.params.error) {
      const {succeed, error} = this.$route.params
      if(succeed) this.toast('Bind succeed: ' + succeed, 'success')
      else this.toast('Bind error: ' + error, 'error')
    }
  }
}
</script>

