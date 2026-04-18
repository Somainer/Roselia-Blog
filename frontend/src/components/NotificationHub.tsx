import { defineComponent, onMounted, computed, getCurrentInstance, h } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoseliaStore } from '../store'
import WsBus from '../plugins/ws-bus'
import { mapToCamelCase } from '../common/helpers'
import { INotification as IToast, sendBrowserNotification } from '@/common/api/notifications'
import type { IInComechatMessage } from '@/common/api/chat'
import { botUserMeta, getUserMeta } from '@/common/api/user'
import type { IRoseliaUserMeta } from '@/common/post-information'

const UserMetaCache: Map<string, IRoseliaUserMeta> = new Map()
async function getCachedUserMeta(username: string): Promise<IRoseliaUserMeta> {
  if (UserMetaCache.has(username)) return UserMetaCache.get(username)!
  const userMeta = await getUserMeta({ username })
  UserMetaCache.set(username, userMeta)
  return userMeta
}

export default defineComponent({
  name: 'notification-hub',
  setup() {
    const store = useRoseliaStore()
    const { notifications, firstNotification, currentChatingWith } = storeToRefs(store)

    const notify = (notification: IToast) => {
      store.addNotification(notification)
    }
    const popFirst = () => store.popFirstNotification()

    const currentToast = computed(() => firstNotification.value)
    const router = (getCurrentInstance() as any).appContext.config.globalProperties.$router

    onMounted(() => {
      const instance = getCurrentInstance()
      if (instance) instance.appContext.config.globalProperties.$notify = notify

      WsBus.subscribe(bus => {
        bus.addEventListener('disconnect', () => {
          notify({
            color: 'warning',
            message: h('div', [
              'Your connection has been closed.',
              h('v-btn' as any, { color: 'primary', onClick: () => { WsBus.tryConnect(); popFirst() } }, 'Connect')
            ]) as any
          })
        })
        bus.addEventListener('post_commented', data => {
          const { postId, title, byName } = mapToCamelCase(data) as any
          const route = { name: 'post', query: { p: postId } }
          notify({
            color: 'info',
            message: h('div', [
              `${byName} has commented on your post: `,
              h('router-link' as any, { to: route }, title)
            ]) as any
          })
          sendBrowserNotification('New Comment', {
            image: botUserMeta.avatar,
            icon: botUserMeta.avatar,
            badge: '/favicon.png',
            body: `${byName} has commented on your post: ${title}.`
          }).then(notification => {
            notification.addEventListener('click', () => { router && router.push(route) })
          })
        }, true)
        bus.addEventListener('user_login', data => {
          const { ip, browser, os } = data
          notify({ color: 'warning', message: `You have logged in a ${os} ${browser} device on ip: ${ip}.` })
        }, true)
        bus.addEventListener('warn_message', data => {
          const { message } = data
          notify({ color: 'warning', message })
        }, true)
        bus.addEventListener('inbox_message', (data: IInComechatMessage) => {
          if (currentChatingWith.value !== data.from) {
            notify({
              color: 'info',
              message: h('div', [
                h('v-btn' as any, { icon: 'mdi-reply', onClick: () => store.setChatingWith(data.from) }),
                `@${data.from}: ${data.content}`
              ]) as any
            })
          }
          if (currentChatingWith.value !== data.from || !document.hasFocus()) {
            sendBrowserNotification(`New Message from @${data.from}`, {
              body: String(data.content),
              badge: '/favicon.png',
              tag: Math.random().toString(36)
            }).then(notification => {
              notification.addEventListener('click', () => store.setChatingWith(data.from))
              getCachedUserMeta(data.from).then(userMeta => {
                sendBrowserNotification(`New Message from ${userMeta.nickname}`, {
                  renotify: true,
                  image: userMeta.avatar,
                  icon: userMeta.avatar,
                  badge: (notification as any).badge,
                  body: (notification as any).body,
                  tag: (notification as any).tag
                }).then(n => {
                  n.addEventListener('click', () => store.setChatingWith(data.from))
                })
              })
            })
          }

          store.addChatHistory({ username: data.from, chat: data })
        }, true)
      })
    })

    return () => {
      const first = currentToast.value as IToast | undefined
      if (!first) return h('div')
      return h('div', [
        h(
          'v-snackbar' as any,
          {
            location: 'bottom right',
            vertical: true,
            color: first.color,
            'model-value': first.show,
            timeout: 0
          },
          {
            default: () => first.message,
            actions: () => h('v-row', [
              h('v-col', [
                h('v-btn' as any, { variant: 'text', onClick: () => store.clearNotifications() }, {
                  default: () => h('v-icon', 'mdi-delete-sweep')
                })
              ]),
              h('v-spacer'),
              h('v-col', [
                h(
                  'v-btn' as any,
                  { variant: 'text', onClick: () => { first.show = false; popFirst() } },
                  () => notifications.value.length > 1
                    ? h('span', [h('v-icon', 'mdi-chevron-right'), `(${notifications.value.length - 1}+)`])
                    : h('v-icon', 'mdi-close')
                )
              ])
            ])
          }
        )
      ])
    }
  }
})
