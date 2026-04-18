import { defineStore } from 'pinia'
import type { INotification } from './common/api/notifications'
import { omit } from '@/common/fake-lodash'
import type { IRoseliaUserMeta } from './common/post-information'
import type { IInComechatMessage } from './common/api/chat'
import { getUserMeta } from './common/api/user'
import type { IRoseliaUserData } from './common/UserInfoManager'

export interface IRoseliaStoreState {
  commentDraft: Record<number, object>
  notifications: INotification[]
  chatHistory: Record<string, IInComechatMessage[]>
  currentUser?: IRoseliaUserMeta
  userData?: IRoseliaUserData
  currentChatingWith?: string
}

export const useRoseliaStore = defineStore('roselia', {
  state: (): IRoseliaStoreState => ({
    commentDraft: {},
    notifications: [],
    chatHistory: {},
    userData: undefined,
    currentUser: undefined,
    currentChatingWith: undefined
  }),
  getters: {
    firstNotification: (state) => state.notifications[0],
    chatHistoryOf: (state) => (ofUsername: string) =>
      state.chatHistory[ofUsername.toLowerCase()] || []
  },
  actions: {
    setCommentDraft(payload: { commentId: number; comment: object }) {
      this.commentDraft = { ...this.commentDraft, [payload.commentId]: payload.comment }
    },
    removeCommentDraft(commentId: number) {
      this.commentDraft = omit(this.commentDraft, [commentId])
    },
    addNotification(notification: INotification) {
      this.notifications = [{ ...notification, show: true }, ...this.notifications]
    },
    popFirstNotification() {
      const [, ...rest] = this.notifications
      this.notifications = rest
    },
    clearNotifications() {
      this.notifications = []
    },
    addChatHistory(payload: { username: string; chat: IInComechatMessage }) {
      const username = payload.username.toLowerCase()
      this.chatHistory = {
        ...this.chatHistory,
        [username]: (this.chatHistory[username] || []).concat(payload.chat)
      }
    },
    setUserMeta(meta: IRoseliaUserMeta | undefined) {
      this.currentUser = meta
    },
    setUserData(data: IRoseliaUserData | undefined) {
      this.userData = data
    },
    setChatingWith(username: string | undefined) {
      this.currentChatingWith = username
    },
    async ensureUserMeta() {
      if (this.currentUser) return this.currentUser
      if (!this.userData) return undefined
      const { username } = this.userData
      const userMeta = await getUserMeta({ username })
      this.setUserMeta(userMeta)
      return userMeta
    }
  }
})

export type RoseliaStore = ReturnType<typeof useRoseliaStore>
