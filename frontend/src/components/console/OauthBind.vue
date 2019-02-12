<template>
  <v-layout align-center justify-center>
    <h4>OAuth Accounts</h4>
    <v-spacer></v-spacer>
    <v-layout row wrap>
      <v-card-actions>
        <v-btn 
          v-for="{adapter, isBound, user} in adapterList" 
          :key="adapter" 
          round color="accent" dark 
          @click="goToBind(adapter)"
        >
          <v-icon v-if="$vuetify.icons.brand[adapter]">{{$vuetify.icons.brand[adapter]}}</v-icon>
          <span v-else>{{ adapter }}</span>
        </v-btn>
      </v-card-actions>
    </v-layout>
    
  </v-layout>
</template>

<script>
import utils from '../../common/utils'
import {tupleToDict} from '../../common/helpers'
export default {
  props: ['userData', 'toast'],
  data() {
    return {
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
      utils.fetchJSONWithSuccess(utils.apiFor('oauth', 'bind', adapter, 'url')).then(url => {
        location.href = url
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
    if(this.$route.query.succeed) {
      this.toast('Bind succeed: ' + this.$route.query.succeed, 'success')
      this.$router.replace({
        ...this.$route,
        query: {
          ...this.$route.query,
          succeed: undefined
        }
      })
    }
  }
}
</script>

