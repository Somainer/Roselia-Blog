<template>
<v-container fluid>
  <v-row wrap>
    <v-col xs="12" sm="12">
      <div>
        <h1>System Monitor</h1>
      </div>
      <v-card
        class="round-corner-card elevation-5 primary-card-gradient"
        dark
      >
        <v-card-title primary-title>
          <div>
            <div class="headline">Platform</div>
            <h2>
              {{ basic.os.node }}
            </h2>
            <span class="subtitle-1">
              <v-icon>desktop_mac</v-icon> {{ basic.os.name }} {{ basic.os.version }} ({{ basic.os.platform }})
            </span>
            <p>{{ basic.os.serverInterpreter }}</p>
            <v-divider></v-divider>
            Refresh Loop:
            <span class="subtitle-2" v-if="!!mainTimer">
              On
              <v-btn icon text dark @click="stopLoop">
                <v-icon>pause</v-icon>
              </v-btn>
            </span>
            <span class="subtitle-2" v-else>
              Off
              <v-btn icon text dark @click="startLoop">
                <v-icon>play_arrow</v-icon>
              </v-btn>
            </span>
          </div>
        </v-card-title>
      </v-card>
      <v-card
        class="round-corner-card elevation-5 secondary-card-gradient"
        dark
      >
        <v-card-title primary-title>
          <div>
            <div class="headline">CPU</div>
            <h2>
              {{ basic.cpu.name }}
            </h2>
            <span class="subtitle-1">
              {{ basic.cpu.totalCore }} Cores {{ basic.cpu.logicalCore }} Threads
            </span>
          </div>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-title>
          <div>
            <v-progress-circular
              :rotate="-90"
              :size="150"
              :width="15"
              :value="dynamic.cpu.total"
            >
              <span class="subtitle-1">Total: {{ dynamic.cpu.total }} %</span>
            </v-progress-circular>
          </div>
          <div v-if="dynamic.cpu.logic.length > 1">
            <v-progress-circular
              v-for="(percent, core) in dynamic.cpu.logic"
              :key="core"
              :rotate="-90"
              :size="100"
              :width="15"
              :value="percent"
            >
              <span class="caption">Core{{ core }}: {{ percent }} % </span>
            </v-progress-circular>
          </div>
        </v-card-title>
      </v-card>
      <v-card
        class="round-corner-card elevation-5 secondary-card-gradient"
        dark
      >
        <v-card-title primary-title>
          <div>
            <div class="headline">Memory</div>
            <h3>
              Virtual Memory
            </h3>
            <p class="subtitle-1">{{ usedMemory }} Used</p>
            <p class="subtitle-1">{{ availableMemory }} Available</p>
            <p class="subtitle-1">{{ totalMemory }} Total</p>
            <v-icon>memory</v-icon> {{ dynamic.memory.percent }} %
            <v-progress-linear
              background-color="info"
              color="warning"
              :value="dynamic.memory.percent"
            ></v-progress-linear>
          </div>
        </v-card-title>
      </v-card>
      <div>
        <div>
          <h1>Revoke All Issued Tokens</h1>
          <v-col rows="12">
            <v-alert :value="true" type="warning">
              This will revoke all issued tokens, and you will be logged out after that.
            </v-alert>
          </v-col>
          <v-btn @click="refreshSalt" color="warning" @mouseleave="confirmRefresh = false">
            <v-icon>cloud_off</v-icon> {{ confirmRefresh ? 'Confirm ' : '' }}Revoke
          </v-btn>
        </div>
      </div>
    </v-col>
  </v-row>
</v-container>
</template>

<script>
import utils from '../../common/utils'
import { mapToCamelCase } from '../../common/helpers';
export default {
  props: ['userData', 'toast'],
  data() {
    return {
      basic: {
        cpu: {
          logicalCore: 0,
          totalCore: 0,
          name: ''
        },
        os: {
          name: '',
          node: '',
          platform: '',
          version: '',
          serverInterpreter: ''
        }
      },
      dynamic: {
        cpu: {
          total: 0,
          logic: []
        },
        memory: {
          percent: 0,
          total: 0,
          used: 0,
          available: 0
        }
      },
      mainTimer: 0,
      removeBlurListener: null,
      removeFocusListener: null,
      confirmRefresh: false
    }
  },
  computed: {
    usedMemory() {
      return this.readableMemory(this.dynamic.memory.used)
    },
    availableMemory() {
      return this.readableMemory(this.dynamic.memory.available)
    },
    totalMemory() {
      return this.readableMemory(this.dynamic.memory.total)
    }
  },
  methods: {
    getBasicInfo() {
      utils.fetchJSONWithSuccess(utils.apiFor('system', 'basic-info')).then(mapToCamelCase).then(data => {
        this.basic = data
      }).catch(err => {
        this.toast('You can not access such info.', 'error')
      })
    },
    getDynamicInfo() {
      utils.fetchJSONWithSuccess(utils.apiFor('system', 'dynamic-info')).then(mapToCamelCase).then(data => {
        this.dynamic = data
      }).catch(err => {
        this.destroyTimer()
        this.toast('You can not access such info.', 'error')
      })
    },
    readableMemory(bytes) {
      const units = ['B', 'KB', 'MB', 'GB', 'TB', 'TB']
      const [value, unit] = units.reduce(([byte, unit]) => {
        if(byte < 1024) return [byte, unit]
        return [byte / 1024, unit + 1]
      }, [bytes, 0])
      return value.toFixed(2) + units[unit]
    },
    refreshSalt() {
      if(!this.confirmRefresh) {
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
            alert: {
              color: 'info',
              text: 'All tokens revoked, so is your token, please login again.'
            }
          }
        })
      }).error(err => {
        this.toast('Something is wrong', 'error')
      })
    },
    setListenerByVisibility() {
      if(!document.hidden) {
        this.createTimer()
      } else {
        this.destroyTimer()
      }
    },
    createTimer() {
      if(!this.mainTimer) {
        this.mainTimer = setInterval(this.getDynamicInfo, 2000)
      }
    },
    destroyTimer() {
      if (this.mainTimer) {
        clearInterval(this.mainTimer)
        this.mainTimer = null
      }
    },
    setFocusTriggers() {
      if(!this.removeBlurListener) this.removeBlurListener = utils.addEventListener('blur', this.destroyTimer)
      if(!this.removeFocusListener) this.removeFocusListener = utils.addEventListener('focus', this.createTimer)
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
  },
  mounted() {
    this.getBasicInfo()
    this.getDynamicInfo()
    this.createTimer()
    this.setFocusTriggers()
  },
  beforeDestroy() {
    this.destroyTimer()
    this.destroyFocusTriggers()
  }
}
</script>
<style scoped>
.round-corner-card {
  border-radius: 25px;
}
.primary-card-gradient {
  background: linear-gradient(20deg, #2b499f, #de94fc);
}
.secondary-card-gradient {
  background: linear-gradient(20deg, rgb(14, 60, 96), rgb(75, 198, 227));
}
</style>
