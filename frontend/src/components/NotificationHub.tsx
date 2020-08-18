import Vue, { VNode } from 'vue'
import Component from 'vue-class-component'
import { Mutation, State } from 'vuex-class'
import { VSnackbar, VBtn, VRow, VCol, VSpacer, VIcon } from 'vuetify/lib'
import WsBus from '../plugins/ws-bus'
import { mapToCamelCase } from '../common/helpers'
import { INotification as IToast, sendBrowserNotification } from '@/common/api/notifications'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { IInComechatMessage } from '@/common/api/chat'
import { botUserMeta, getUserMeta } from '@/common/api/user'
import type { IRoseliaUserMeta } from '@/common/post-information'


@Component({
  components: {
    VSnackbar,
    VBtn, VRow, VCol, VSpacer, VIcon
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
  private static UserMetaCache: Map<string, IRoseliaUserMeta> = new Map();
  private static async GetUserMeta(username: string): Promise<IRoseliaUserMeta> {
    if (this.UserMetaCache.has(username)) {
      return this.UserMetaCache.get(username)!
    }
    const userMeta = await getUserMeta({ username })
    this.UserMetaCache.set(username, userMeta);
    return userMeta;
  }

  private notify(notification: IToast): void {
    (this as any).addNotification(notification)
  }

  private popFirst() {
    (this as any).popFirstNotification()
  }

  private get currentToast() {
    return (this as any).firstNotification
  }

  @Mutation addChatHistory!: (data: {
    chat: IInComechatMessage,
    username: string
  }) => void

  @Mutation setChatingWith!: (username: string) => void
  @State currentChatingWith: string | undefined

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
            <v-btn text onClick={(this as any).clearNotifications}>
              <v-icon>delete_sweep</v-icon>
            </v-btn>
          </v-col>
          <v-spacer></v-spacer>
          <v-col>
            <v-btn
              text
              onClick={() => { first.show = false; this.popFirst() }}
            >
              {notifications.length > 1 ? <span><v-icon>navigate_next</v-icon>({notifications.length - 1}+)</span> : <v-icon>close</v-icon>}
            </v-btn>
          </v-col>
        </v-row>
        
      </v-snackbar>
    </div>)
  }
  
  public mounted() {
    Vue.prototype.$notify = this.notify
    WsBus.subscribe(bus => {
      bus.addEventListener('disconnect', () => {
        this.notify({
          color: 'warning',
          message: (
            <div>
              Your connection has been closed.
              <v-btn color="primary" onClick={() => { 
                WsBus.tryConnect();
                this.popFirst();
              } }>Connect</v-btn>
            </div>
          )
        })
      })
      bus.addEventListener('post_commented', data => {
        const { postId, title, byName } = mapToCamelCase(data) as any
        const route = {name: 'post', query: {p: postId}}
        this.notify({
          color: 'info',
          message: (
            <div>
              {byName} has commented on your post: 
              <router-link to={route}>{title}</router-link>
            </div>
          )
        })
        sendBrowserNotification(`New Comment`, {
          image: botUserMeta.avatar,
          icon: botUserMeta.avatar,
          badge: '/favicon.png',
          body: `${byName} has commented on your post: ${title}.`
        }).then(notification => {
          notification.addEventListener('click', () => {
            this.$router.push(route)
          })
        })
      }, true)
      bus.addEventListener('user_login', data => {
        const { ip, browser, os } = data
        this.notify({
          color: 'warning',
          message: `You have logged in a ${os} ${browser} device on ip: ${ip}.`
        })
      }, true)
      bus.addEventListener('warn_message', data => {
        const { message } = data;
        this.notify({
          color: 'warning',
          message
        })
      }, true)
      bus.addEventListener('inbox_message', (data: IInComechatMessage) => {
        if (this.currentChatingWith !== data.from) {
          this.notify({
            color: 'info',
            message: <div>
              <v-btn icon onClick={() => this.setChatingWith(data.from)}>
                <v-icon>reply</v-icon>
              </v-btn>
              @{data.from}: {data.content}
            </div>
          })
        }
        if (this.currentChatingWith !== data.from || !document.hasFocus()) {
          sendBrowserNotification(`New Message from @${data.from}`, {
            body: `${data.content}`,
            badge: '/favicon.png',
            tag: `${Math.random().toString(36)}`
          }).then(notification => {
            notification.addEventListener('click', () => { 
              this.setChatingWith(data.from)
            })
            NotificationHub.GetUserMeta(data.from).then(userMeta => {
              sendBrowserNotification(`New Message from ${userMeta.nickname}`, {
                renotify: true,
                image: userMeta.avatar,
                icon: userMeta.avatar,
                badge: notification.badge,
                body: notification.body,
                tag: notification.tag
              }).then(n => {
                n.addEventListener('click', () => { 
                  this.setChatingWith(data.from)
                })
              })
            })
          })
        }
      
        this.addChatHistory({
          username: data.from,
          chat: data
        })
      }, true)
    })
  }
}
