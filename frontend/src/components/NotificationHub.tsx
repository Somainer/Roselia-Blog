import Vue, { VNode } from 'vue'
import { VSnackbar, VBtn, VRow, VCol, VSpacer } from 'vuetify/lib'
import WsBus from '../plugins/ws-bus'
import { mapToCamelCase } from '../common/helpers'

interface IToast {
  time?: number
  message: VNode | string
  color?: string
  id?: number
  show?: boolean
}

export default class NotificationHub extends Vue {
  private notifications: IToast[] = []

  public components = {
    VSnackbar,
    VBtn, VRow, VCol, VSpacer
  }

  private notify(notification: IToast): void {
    this.notifications = this.notifications.concat({
      ...notification,
      show: true
    })
  }

  private popFirst() {
    this.notifications = this.notifications.splice(1)
  }

  private get currentToast() {
    return this.notifications[0]
  }

  public render() {
    const first: IToast = this.currentToast
    if (!first) {
      return <div></div>
    }
    return (<div>
      <v-snackbar
        right bottom vertical multi-line
        color={first.color}
        value={first.show}
        timeout={0}
      >
        {first.message}
        <v-row>
          <v-col>
            <v-btn text onClick={() => { this.notifications = [] }}>Dismiss All</v-btn>
          </v-col>
          <v-spacer></v-spacer>
          <v-col>
            <v-btn
              text
              onClick={() => { first.show = false; this.popFirst() }}
            >
              {this.notifications.length > 1 ? `Next (${this.notifications.length - 1} more)` : 'Close'}
            </v-btn>
          </v-col>
        </v-row>
        
      </v-snackbar>
    </div>)
  }
  
  public mounted() {
    Vue.prototype.$toast = this.notify
    if(WsBus.globalBus) {
      WsBus.globalBus.addEventListener('post_commented', data => {
        const {postId, title, byName} = mapToCamelCase(data) as any
        this.notify({
          color: 'info',
          message: (
            <div>
              {byName} has commented on your post: 
              <router-link to={{name: 'post', query: {p: postId}}}>{title}</router-link>
            </div>
          )
        })
      })
      WsBus.globalBus.addEventListener('user_login', data => {
        const { ip, browser, os } = data
        this.notify({
          color: 'warning',
          message: `You have logged in a ${os} ${browser} device on ip: ${ip}.`
        })
      })
    }
  }
}
