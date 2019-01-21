import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    commentDraft: {}

  },
  mutations: {
    setCommentDraft(state, comment: {commentId: number, comment: object}) {
      state.commentDraft = {
        ...state.commentDraft,
        [comment.commentId]: comment.comment
      }
    },
    removeCommentDraft(state, commentId: number) {
      state.commentDraft = {
        ...state.commentDraft,
        [commentId]: undefined
      }
    }

  },
  actions: {

  },
  getters: {
  }
})
