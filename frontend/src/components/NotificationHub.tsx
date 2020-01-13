import Vue, { VNode } from 'vue'
import Component from 'vue-class-component'
import { VSnackbar, VBtn, VRow, VCol, VSpacer } from 'vuetify/lib'
import WsBus from '../plugins/ws-bus'
import { mapToCamelCase } from '../common/helpers'
import { INotification as IToast } from '@/common/api/notifications'
import { mapGetters, mapMutations, mapState } from 'vuex'


@Component({
  components: {
    VSnackbar,
    VBtn, VRow, VCol, VSpacer
  },
  computed: {
    ...mapGetters(['firstNotification']),
    ...mapState(['notifications'])
  },
  methods: {
    ...mapMutations([
      'clearNotifications',
      'popFirstNotification',
      'addNotification'
    ])
  }
})
export default class NotificationHub extends Vue {

  private notify(notification: IToast): void {
    (this as any).addNotification(notification)
  }

  private popFirst() {
    (this as any).popFirstNotification()
  }

  private get currentToast() {
    return (this as any).firstNotification
  }

  public render() {
    const first: IToast = this.currentToast
    if (!first) {
      return <div></div>
    }
    const notifications = (this as any).notifications
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
            <v-btn text onClick={(this as any).clearNotifications}>Dismiss All</v-btn>
          </v-col>
          <v-spacer></v-spacer>
          <v-col>
            <v-btn
              text
              onClick={() => { first.show = false; this.popFirst() }}
            >
              {notifications.length > 1 ? `Next (${notifications.length - 1} more)` : 'Close'}
            </v-btn>
          </v-col>
        </v-row>
        
      </v-snackbar>
    </div>)
  }
  
  public mounted() {
    Vue.prototype.$notify = this.notify
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
      }, true)
      WsBus.globalBus.addEventListener('user_login', data => {
        const { ip, browser, os } = data
        this.notify({
          color: 'warning',
          message: `You have logged in a ${os} ${browser} device on ip: ${ip}.`
        })
      }, true)
    }
  }
}
