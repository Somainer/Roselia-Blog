import Vue from 'vue'
import Vuex from 'vuex'
import { INotification } from './common/api/notifications'
import { omit } from '@/common/fake-lodash'
import type { IRoseliaUserMeta } from './common/post-information'
import type { IInComechatMessage } from './common/api/chat'
import { getUserMeta } from './common/api/user'
import type { IRoseliaUserData } from './common/UserInfoManager'

Vue.use(Vuex)

export interface IRoseliaStoreState {
  commentDraft: {
    [id: number]: object
  }

  notifications: INotification[]
  chatHistory: Record<string, IInComechatMessage[]>
  currentUser?: IRoseliaUserMeta
  userData?: IRoseliaUserData
  currentChatingWith?: string
}

export default new Vuex.Store<IRoseliaStoreState>({
  state: {
    commentDraft: {},
    notifications: [],
    chatHistory: {},
    userData: undefined,
    currentUser: undefined,
    currentChatingWith: undefined
  },
  mutations: {
    setCommentDraft(state, comment: {commentId: number, comment: object}) {
      state.commentDraft = {
        ...state.commentDraft,
        [comment.commentId]: comment.comment
      }
    },
    removeCommentDraft(state, commentId: number) {
      state.commentDraft = omit(state.commentDraft, [commentId])
      // state.commentDraft = {
      //   ...state.commentDraft,
      //   [commentId]: undefined
      // }
    },
    addNotification(state, notification: INotification) {
      state.notifications = [{ ...notification, show: true }, ...state.notifications]
    },
    popFirstNotification(state) {
      const [, ...notifications] = state.notifications
      state.notifications = notifications
    },
    clearNotifications(state) {
      state.notifications = []
    },
    addChatHistory(state, { username, chat }: {
      username: string
      chat: IInComechatMessage
    }) {
      username = username.toLowerCase()
      state.chatHistory = { ...state.chatHistory, [username]: (state.chatHistory[username] || []).concat(chat) }
    },
    setUserMeta(state, meta: IRoseliaUserMeta) {
      state.currentUser = meta;
    },
    setUserData(state, data: IRoseliaUserData) {
      state.userData = data;
    },
    setChatingWith(state, username: string | undefined) {
      state.currentChatingWith = username;
    }
  },
  actions: {
    async ensureUserMeta(store) {
      if (store.state.currentUser) return store.state.currentUser
      if (!store.state.userData) return undefined
      const { username } = store.state.userData
      const userMeta = await getUserMeta({ username })
      store.commit('setUserMeta', userMeta)
      return userMeta
    }
  },
  getters: {
    firstNotification(state) {
      const [first] = state.notifications
      return first
    },
    chatHistoryOf: (state) => (ofUsername: string) => {
      return state.chatHistory[ofUsername.toLowerCase()] || []
    }
  }
})
