<template>
  <v-container 
    fluid
    grid-list-md
  >
    <v-layout row wrap>
      <h2>OAuth Accounts</h2>
      <v-card-actions>
        <v-flex
          v-for="{adapter, isBound, bindUser} in adapterList" 
          :key="adapter"
         >
          <v-btn 
            v-if="!isBound"
            round color="accent" dark 
            @click="goToBind(adapter)"
          >
            <v-icon v-if="$vuetify.icons.brand[adapter]">{{$vuetify.icons.brand[adapter]}}</v-icon>
            <span v-else>{{ adapter }}</span>
          </v-btn>
          <div v-else>
            <v-icon v-if="$vuetify.icons.brand[adapter]">{{$vuetify.icons.brand[adapter]}}</v-icon>
            <span v-else>{{ adapter }}</span>
            :
            <span>{{ bindUser }}</span>
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

