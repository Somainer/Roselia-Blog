<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div>
          <h1>System Monitor</h1>
        </div>
        <v-card class="round-corner-card elevation-5 primary-card-gradient" theme="dark" rounded="lg">
          <v-card-title>
            <div>
              <div class="text-h5">Platform</div>
              <h2>{{ basic.os.node }}</h2>
              <span class="text-subtitle-1">
                <v-icon>mdi-monitor</v-icon> {{ basic.os.name }} {{ basic.os.version }} ({{ basic.os.platform }})
              </span>
              <p>{{ basic.os.serverInterpreter }}</p>
              <v-divider></v-divider>
              Refresh Loop:
              <span class="text-subtitle-2" v-if="mainTimer">
                On
                <v-btn icon="mdi-pause" variant="text" @click="stopLoop"></v-btn>
              </span>
              <span class="text-subtitle-2" v-else>
                Off
                <v-btn icon="mdi-play" variant="text" @click="startLoop"></v-btn>
              </span>
            </div>
          </v-card-title>
        </v-card>

        <v-card class="round-corner-card elevation-5 secondary-card-gradient" theme="dark" rounded="lg">
          <v-card-title>
            <div>
              <div class="text-h5">CPU</div>
              <h2>{{ basic.cpu.name }}</h2>
              <span class="text-subtitle-1">{{ basic.cpu.totalCore }} Cores {{ basic.cpu.logicalCore }} Threads</span>
            </div>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-title>
            <div>
              <v-progress-circular :rotate="-90" :size="150" :width="15" :model-value="dynamic.cpu.total">
                <span class="text-subtitle-1">Total: {{ dynamic.cpu.total }} %</span>
              </v-progress-circular>
            </div>
            <div v-if="dynamic.cpu.logic.length > 1">
              <v-progress-circular
                v-for="(percent, core) in dynamic.cpu.logic"
                :key="core"
                :rotate="-90"
                :size="100"
                :width="15"
                :model-value="percent"
              >
                <span class="text-caption">Core{{ core }}: {{ percent }} %</span>
              </v-progress-circular>
            </div>
          </v-card-title>
        </v-card>

        <v-card class="round-corner-card elevation-5 secondary-card-gradient" theme="dark" rounded="lg">
          <v-card-title>
            <div>
              <div class="text-h5">Memory</div>
              <h3>Virtual Memory</h3>
              <p class="text-subtitle-1">{{ usedMemory }} Used</p>
              <p class="text-subtitle-1">{{ availableMemory }} Available</p>
              <p class="text-subtitle-1">{{ totalMemory }} Total</p>
              <v-icon>mdi-memory</v-icon> {{ dynamic.memory.percent }} %
              <v-progress-linear bg-color="info" color="warning" :model-value="dynamic.memory.percent"></v-progress-linear>
            </div>
          </v-card-title>
        </v-card>

        <div>
          <div>
            <h1>Revoke All Issued Tokens</h1>
            <v-col cols="12">
              <v-alert type="warning">
                This will revoke all issued tokens, and you will be logged out after that.
              </v-alert>
            </v-col>
            <v-btn color="warning" @click="refreshSalt" @mouseleave="confirmRefresh = false">
              <v-icon>mdi-cloud-off-outline</v-icon> {{ confirmRefresh ? 'Confirm ' : '' }}Revoke
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import utils from '../../common/utils'
import { mapToCamelCase } from '../../common/helpers'

export default defineComponent({
  name: 'system-monitor',
  props: {
    userData: { type: Object as PropType<any>, required: true },
    toast: { type: Function as PropType<(text: string, color?: string) => void>, required: true }
  },
  data() {
    return {
      basic: {
        cpu: { logicalCore: 0, totalCore: 0, name: '' },
        os: { name: '', node: '', platform: '', version: '', serverInterpreter: '' }
      },
      dynamic: {
        cpu: { total: 0, logic: [] as number[] },
        memory: { percent: 0, total: 0, used: 0, available: 0 }
      },
      mainTimer: 0 as any,
      removeBlurListener: null as null | (() => void),
      removeFocusListener: null as null | (() => void),
      confirmRefresh: false
    }
  },
  computed: {
    usedMemory(): string { return this.readableMemory(this.dynamic.memory.used) },
    availableMemory(): string { return this.readableMemory(this.dynamic.memory.available) },
    totalMemory(): string { return this.readableMemory(this.dynamic.memory.total) }
  },
  mounted() {
    this.getBasicInfo()
    this.getDynamicInfo()
    this.createTimer()
    this.setFocusTriggers()
  },
  beforeUnmount() {
    this.destroyTimer()
    this.destroyFocusTriggers()
  },
  methods: {
    getBasicInfo() {
      utils.fetchJSONWithSuccess(utils.apiFor('system', 'basic-info')).then(mapToCamelCase).then((data: any) => {
        this.basic = data
      }).catch(() => this.toast('You can not access such info.', 'error'))
    },
    getDynamicInfo() {
      utils.fetchJSONWithSuccess(utils.apiFor('system', 'dynamic-info')).then(mapToCamelCase).then((data: any) => {
        this.dynamic = data
      }).catch(() => {
        this.destroyTimer()
        this.toast('You can not access such info.', 'error')
      })
    },
    readableMemory(bytes: number): string {
      const units = ['B', 'KB', 'MB', 'GB', 'TB', 'TB']
      const [value, unit] = units.reduce(([byte, unitIdx]: any) => {
        if (byte < 1024) return [byte, unitIdx]
        return [byte / 1024, unitIdx + 1]
      }, [bytes, 0]) as [number, number]
      return value.toFixed(2) + units[unit]
    },
    refreshSalt() {
      if (!this.confirmRefresh) {
        this.confirmRefresh = true
        return
      }
      this.confirmRefresh = false
      utils.fetchJSONWithSuccess(utils.apiFor('system', 'refresh-salt'), 'POST').then(() => {
        this.toast('Tokens revoked', 'success')
        this.$router.push({
          name: 'login',
          params: {
            logout: true,
            alert: { color: 'info', text: 'All tokens revoked, so is your token, please login again.' }
          }
        } as any)
      }).catch(() => this.toast('Something is wrong', 'error'))
    },
    createTimer() {
      if (!this.mainTimer) this.mainTimer = window.setInterval(this.getDynamicInfo, 2000)
    },
    destroyTimer() {
      if (this.mainTimer) {
        clearInterval(this.mainTimer)
        this.mainTimer = 0
      }
    },
    setFocusTriggers() {
      if (!this.removeBlurListener) this.removeBlurListener = utils.addEventListener('blur', this.destroyTimer)
      if (!this.removeFocusListener) this.removeFocusListener = utils.addEventListener('focus', this.createTimer)
    },
    destroyFocusTriggers() {
      this.removeBlurListener && this.removeBlurListener()
      this.removeFocusListener && this.removeFocusListener()
      this.removeBlurListener = this.removeFocusListener = null
    },
    startLoop() {
      this.createTimer()
      this.setFocusTriggers()
    },
    stopLoop() {
      this.destroyFocusTriggers()
      this.destroyTimer()
    }
  }
})
</script>

<style scoped>
.round-corner-card { border-radius: 25px; }
.primary-card-gradient { background: linear-gradient(20deg, #2b499f, #de94fc); }
.secondary-card-gradient { background: linear-gradient(20deg, rgb(14, 60, 96), rgb(75, 198, 227)); }
</style>
