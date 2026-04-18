import { defineComponent, ref, computed, watch, onMounted, nextTick, type PropType, h } from 'vue'
import { useRoseliaStore } from '../store'
import RecursiveComments from './RecursiveComments'
import type { IRoseliaUserMeta, IRoseliaPostComment } from '@/common/post-information'
import { markdown } from '../common/roselia-markdown'
import { getUserMeta } from '@/common/api/user'
import { type IInComechatMessage, sendMessage, getOnlineStatus } from '@/common/api/chat'

export const ChatBox = defineComponent({
  name: 'chat-box',
  components: { RecursiveComments },
  props: {
    username: { type: String, required: true },
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const store = useRoseliaStore()
    const targetUserMeta = ref<IRoseliaUserMeta | undefined>(undefined)
    const message = ref('')
    const isTargetUserOnline = ref(false)
    const isMultiLine = ref(false)
    const history = ref<Element | null>(null)

    const dummyTargetUserMeta = computed<IRoseliaUserMeta>(() => ({
      id: 0,
      username: props.username,
      role: 0,
      nickname: props.username
    } as any))

    const myUserData = computed(() => store.userData)
    const myUserMeta = computed(() => store.currentUser)

    const chatMessages = computed(() => store.chatHistoryOf(props.username))

    const conversation = computed<IRoseliaPostComment[]>(() =>
      chatMessages.value.map((msg: IInComechatMessage, id: number) => ({
        id,
        content: markdown(String(msg.content)),
        replies: [],
        createdAt: (msg.createdAt as any) ?? new Date(),
        author: msg.from === props.username
          ? (targetUserMeta.value || dummyTargetUserMeta.value)
          : (myUserMeta.value as any)
      }) as any)
    )

    watch(conversation, () => {
      nextTick(() => {
        const element = history.value as any
        if (element) element.scrollTop = element.scrollHeight
      })
    })

    const addSingleConversation = (content: string, isIncoming: boolean) => {
      const myUsername = (myUserData.value as any)?.username || ''
      const sender = isIncoming ? props.username : myUsername
      const receiver = isIncoming ? myUsername : props.username
      const dialog: IInComechatMessage = { content, from: sender, to: receiver }
      store.addChatHistory({ username: props.username, chat: dialog })
    }

    const sendChatMessage = (content: string) => {
      sendMessage({ content, to: props.username, createdAt: new Date() })
      addSingleConversation(content, false)
    }

    const handleSendMessage = () => {
      if (!message.value) return
      sendChatMessage(message.value)
      message.value = ''
      isMultiLine.value = false
    }

    watch(
      () => props.modelValue,
      value => {
        if (value) {
          getOnlineStatus(props.username).then(status => {
            isTargetUserOnline.value = status
          })
        }
      },
      { immediate: true }
    )

    onMounted(() => {
      getUserMeta({ username: props.username }).then(u => {
        targetUserMeta.value = u
      })
    })

    return () => {
      const InputComponent = isMultiLine.value ? 'v-textarea' : 'v-text-field'
      return h(
        'v-dialog' as any,
        {
          'model-value': props.modelValue,
          'onUpdate:modelValue': (v: boolean) => emit('update:modelValue', v),
          width: conversation.value.length ? 1000 : 500,
          scrollable: true
        },
        {
          default: () => h('v-card', {}, {
            default: () => [
              h('v-card-title', { class: 'text-h5' }, {
                default: () => [
                  h(
                    'v-badge' as any,
                    {
                      bordered: true,
                      location: 'bottom',
                      color: isTargetUserOnline.value ? 'success' : 'grey',
                      dot: true,
                      'offset-x': '10',
                      'offset-y': '10'
                    },
                    {
                      default: () => h('v-avatar', { size: 40 }, {
                        default: () => targetUserMeta.value?.avatar
                          ? h('v-img', { src: targetUserMeta.value.avatar })
                          : h('span', (targetUserMeta.value?.nickname || '')[0] || '')
                      })
                    }
                  ),
                  h('span', { class: 'ma-2' }, `Chat with @${props.username}`)
                ]
              }),
              h(
                'v-card-text',
                { style: 'max-height: 62vh;', ref: history as any },
                {
                  default: () => h('v-container', {}, {
                    default: () => h('v-row', {}, {
                      default: () => h('v-col', { cols: 12 }, {
                        default: () => [
                          conversation.value.length && h(RecursiveComments, {
                            comments: conversation.value as any,
                            canAddComment: false,
                            canDeleteComment: () => false,
                            myUsername: (myUserData.value as any)?.username
                          }),
                          !conversation.value.length && targetUserMeta.value && h('v-card', {}, {
                            default: () => h('div', { class: 'd-flex flex-no-wrap justify-space-between' }, [
                              h('div', {}, [
                                h('v-card-title', { class: 'text-h5' }, {
                                  default: () => [
                                    targetUserMeta.value?.avatar && h('v-avatar', { class: 'elevation-6' }, {
                                      default: () => h('v-img', { src: targetUserMeta.value!.avatar })
                                    }),
                                    h('span', { class: targetUserMeta.value?.avatar ? 'ma-2' : '' }, targetUserMeta.value?.nickname || '')
                                  ]
                                }),
                                h('v-card-subtitle', {}, `@${targetUserMeta.value?.username}`),
                                h('v-card-subtitle', {}, (targetUserMeta.value as any)?.motto)
                              ]),
                              (targetUserMeta.value as any)?.banner && h('v-avatar', { size: 180, tile: true }, {
                                default: () => h('v-img', { src: (targetUserMeta.value as any).banner })
                              })
                            ])
                          })
                        ]
                      })
                    })
                  })
                }
              ),
              h('v-card-actions', {}, {
                default: () => [
                  h(InputComponent as any, {
                    'hide-details': true,
                    'prepend-icon': 'mdi-message-question',
                    label: `Say Something to ${targetUserMeta.value?.nickname ?? props.username}`,
                    autofocus: true,
                    'model-value': message.value,
                    'onUpdate:modelValue': (v: string) => (message.value = v),
                    onKeydown: (event: KeyboardEvent) => {
                      if (event.key === 'Enter') {
                        if (event.shiftKey) isMultiLine.value = true
                        else if ((event as any).isComposing !== true) {
                          if (!isMultiLine.value || event.ctrlKey) handleSendMessage()
                        }
                      }
                    }
                  }),
                  isMultiLine.value && h('v-btn' as any, {
                    color: 'primary',
                    rounded: true,
                    disabled: !message.value,
                    onClick: handleSendMessage
                  }, {
                    default: () => h('v-icon', 'mdi-send')
                  })
                ]
              }),
              h('v-divider')
            ]
          })
        }
      )
    }
  }
})

export default ChatBox
