import Vue from 'vue'
import Vuex from 'vuex'
import { INotification } from './common/api/notifications'
import { omit } from '@/common/fake-lodash'

Vue.use(Vuex)

interface IRoseliaStoreState {
  commentDraft: {
    [id: number]: object
  }

  notifications: INotification[]
}

export default new Vuex.Store<IRoseliaStoreState>({
  state: {
    commentDraft: {},
    notifications: []
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
    }
  },
  actions: {

  },
  getters: {
    firstNotification(state) {
      const [first] = state.notifications
      return first
    }
  }
})
