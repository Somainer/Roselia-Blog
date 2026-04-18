<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h2>OAuth Accounts</h2>
      </v-col>
      <v-card-actions>
        <v-col v-for="{ adapter, isBound, bindUser } in adapterList" :key="adapter">
          <v-btn
            v-if="!isBound"
            rounded
            color="accent"
            :loading="loading"
            @click="goToBind(adapter)"
          >
            <v-icon>mdi-{{ adapter }}</v-icon>
            <span v-if="false">{{ adapter }}</span>
          </v-btn>
          <div v-else>
            <v-icon>mdi-{{ adapter }}</v-icon>
            <span>{{ adapter }}</span>: <span>{{ bindUser }}</span>
            <v-btn icon size="small" variant="text" color="error" @click="removeAdapter(adapter)">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-col>
      </v-card-actions>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import utils from '../../common/utils'
import { tupleToDict } from '../../common/helpers'

export default defineComponent({
  name: 'oauth-bind',
  props: {
    userData: { type: Object as PropType<any>, default: null },
    toast: { type: Function as PropType<(text: string, color?: string) => void>, required: true }
  },
  data() {
    return {
      loading: false,
      adapters: [] as string[],
      myAdapters: [] as Array<{ adapter: string; user: string }>
    }
  },
  computed: {
    adapterList(): Array<{ adapter: string; isBound: boolean; bindUser: string | null }> {
      return this.mergeAvailableAdapters()
    }
  },
  mounted() {
    this.getAdapters()
    this.getMyAdapters()
    const q: any = this.$route.query
    if (q.succeed || q.error) {
      const { succeed, error } = q
      this.$router.replace({
        ...this.$route,
        query: { ...this.$route.query, succeed: undefined, error: undefined },
        params: { ...(this.$route.params as any), succeed, error }
      } as any)
    }
    const p: any = this.$route.params
    if (p.succeed || p.error) {
      const { succeed, error } = p
      if (succeed) this.toast('Bind succeed: ' + succeed, 'success')
      else this.toast('Bind error: ' + error, 'error')
    }
  },
  methods: {
    getAdapters() {
      utils.fetchJSONWithSuccess(utils.apiFor('login', 'oauth', 'adapters')).then((adps: string[]) => {
        this.adapters = adps
      }).catch((err: any) => this.toast(err, 'error'))
    },
    getMyAdapters() {
      utils.fetchJSONWithSuccess(utils.apiFor('oauth', 'list-bind-adapters')).then((myAdps: any) => {
        this.myAdapters = myAdps
      }).catch((err: any) => this.toast(err, 'error'))
    },
    mergeAvailableAdapters() {
      const adapterDict: Record<string, any> = tupleToDict(
        this.adapters.map(s => [s, { adapter: s, isBound: false, bindUser: null }])
      )
      this.myAdapters.forEach(({ adapter, user }) => {
        if (adapterDict[adapter]) {
          adapterDict[adapter] = { ...adapterDict[adapter], isBound: true, bindUser: user }
        }
      })
      return Object.values(adapterDict)
    },
    goToBind(adapter: string) {
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('oauth', 'bind', adapter, 'url')).then((url: string) => {
        this.toast(`We are now going to ${adapter}...`, 'info')
        location.href = url
      }).catch(() => {
        this.loading = false
        this.toast('Oops! Failed.', 'error')
      })
    },
    removeAdapter(adapter: string) {
      utils.fetchJSONWithSuccess(utils.apiFor('oauth', 'remove-adapter', adapter), 'POST').then(() => {
        this.myAdapters = this.myAdapters.filter(d => d.adapter !== adapter)
        this.toast('Account Removed', 'success')
      }).catch(() => this.toast('Something is strange', 'error'))
    }
  }
})
</script>
