<template>
  <lazy-component text="Load comment">
    <v-container>
      <v-col cols="12" sm="8" offset-sm="2">
        <v-badge :content="String(commentCount)" :model-value="commentCount > 0">
          <v-icon>mdi-comment</v-icon>
        </v-badge>
        <v-divider class="my-3"></v-divider>
      </v-col>
      <v-col v-if="canAddComment" cols="12" sm="8" offset-sm="2">
        <v-row>
          <v-chip
            v-if="replyToComment"
            v-model="chip"
            closable
            color="secondary"
            @click:close="chip = false"
          >@{{ atToNickname }}</v-chip>
          <v-spacer></v-spacer>
          <v-btn color="accent" icon @click="switchPreviewMode">
            <v-icon v-if="showPreview">mdi-pencil</v-icon>
            <v-icon v-else>mdi-eye</v-icon>
          </v-btn>
        </v-row>
        <div v-if="showPreview">
          <recursive-comment
            ref="previewComment"
            :comments="[currentCommentObject]"
            :can-add-comment="false"
            :can-delete-comment="() => false"
            :my-username="userData && userData.username"
          ></recursive-comment>
        </div>
        <v-textarea
          v-else
          ref="commentText"
          v-model="comment"
          auto-grow
          variant="outlined"
          :placeholder="commentPlaceholer"
          color="primary"
          label="Leave a comment"
          @keyup.meta.enter="addComment"
          @keyup.ctrl.enter="addComment"
        ></v-textarea>
        <v-row>
          <v-col cols="4">
            <span v-if="userData && userData.nickname">{{ userData.nickname }}</span>
            <v-text-field v-else v-model="nickname" density="compact" label="Nickname"></v-text-field>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="3" md="2" lg="1">
            <v-btn
              color="primary"
              :disabled="!isValid"
              :loading="loading"
              rounded
              icon="mdi-send"
              @click="addComment"
            ></v-btn>
          </v-col>
        </v-row>
      </v-col>
      <recursive-comment
        ref="comments"
        :comments="recursiveCommentList"
        :can-add-comment="canAddComment"
        :can-delete-comment="canDeleteComment"
        :post-author-username="postData.author && postData.author.username"
        :my-username="userData && userData.username"
        @delete-comment="onDeleteComment"
        @reply-comment="onReplyComment"
      ></recursive-comment>
      <v-row align="center" justify="center" dense>
        <v-col cols="2" class="text-center">
          <v-chip
            class="ml-0"
            color="secondary"
            size="small"
            @click="goToCommentText"
          ><v-icon>mdi-comment-plus</v-icon></v-chip>
          <div v-if="currentPage < totalPages" v-observe-visibility="loadNextPage">
            <v-btn :loading="loading" size="small" block color="secondary" @click="loadNextPage">
              <v-icon>mdi-chevron-down</v-icon>
            </v-btn>
          </div>
          <div v-else-if="loading">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          <div v-else>
            <v-divider></v-divider>
            Tiro Finale
          </div>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="commentToDelete.show" max-width="500" scrollable>
      <v-card>
        <v-card-title class="text-h5">Are you sure?</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          You are deleting this comment:
          <br />
          <recursive-comment
            :comments="commentToDeleteList"
            :can-add-comment="false"
            :can-delete-comment="() => false"
          ></recursive-comment>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="info" variant="text" @click="commentToDelete.show = false">No</v-btn>
          <v-btn color="error" variant="text" @click="confirmDelete">Yes, delete<v-icon>mdi-delete</v-icon></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </lazy-component>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { useGoTo } from 'vuetify'
import { mapState, mapActions } from 'pinia'
import lazyComponent from './lazyComponent.vue'
import { mapToUnderline, mapToCamelCase, safeDictGet } from '@/common/helpers'
import recursiveComment from './RecursiveComments'
import utils from '@/common/utils'
import { markdown } from '../common/roselia-markdown'
import WsBus from '../plugins/ws-bus'
import { useRoseliaStore } from '../store'

export default defineComponent({
  name: 'blog-comment',
  components: { lazyComponent, recursiveComment },
  props: {
    userData: { type: Object as PropType<any>, default: null },
    postData: { type: Object as PropType<any>, required: true },
    toast: { type: Function as PropType<(text: string, color?: string) => void>, required: true },
    renderer: { type: Object as PropType<any>, required: true }
  },
  setup() {
    return { goTo: useGoTo() }
  },
  data() {
    return {
      visible: false,
      chip: false,
      comment: '',
      nickname: '',
      commentLeft: false,
      loading: false,
      currentPage: 0,
      totalPages: 1,
      commentCount: 0,
      commentList: [] as any[],
      replyToComment: undefined as undefined | number,
      hasUnsavedDraft: false,
      commentToDelete: { id: 0, show: false },
      removeTokens: {} as Record<number, string | undefined>,
      cachedDraft: {} as Record<number, any>,
      userMeta: {} as any,
      userMetaLoaded: false,
      showPreview: false,
      globalAddLock: {} as Record<number, boolean>,
      busUnsubscribes: [] as Array<() => void>
    }
  },
  computed: {
    commentPlaceholer(): string {
      return this.commentLeft ? `It is fine to keep silent, dear ${this.currentNickname}.` : 'Say something.'
    },
    currentNickname(): string {
      return (this.userData && this.userData.nickname) || this.nickname
    },
    isValid(): boolean {
      return !!(this.comment && this.currentNickname)
    },
    isLoggedIn(): boolean {
      return !!this.userData
    },
    addPostForm(): any {
      return mapToUnderline({
        toPost: this.postData.id,
        content: this.comment,
        nickname: this.isLoggedIn ? undefined : this.currentNickname,
        toComment: this.replyToComment || undefined
      })
    },
    canAddComment(): boolean {
      return !!(this.userData || this.postData.enableComment)
    },
    commentDict(): Record<number, any> {
      return this.commentList.reduce((acc, cmt) => ({ ...acc, [cmt.id]: cmt }), {})
    },
    atToNickname(): string | undefined {
      const comment = this.getComment(this.replyToComment as number)
      return comment && this.getCommentNickname(comment)
    },
    recursiveCommentList(): any[] {
      const commentDict = this.commentDict
      const comments = this.commentList.filter(c => !c.replyTo).concat(
        this.commentList.filter(c => c.replyTo).filter(c => !commentDict[c.replyTo]).map(c => {
          const comment = { ...this.getCommentOrNotFound(c.replyTo), id: c.replyTo }
          return (commentDict as any)[c.replyTo] = comment
        })
      )
      Object.entries(commentDict).forEach(([k, v]) => {
        ;(commentDict as any)[k] = { ...(v as any), replies: [] }
      })
      this.commentList.forEach(c => {
        if (c.replyTo) commentDict[c.replyTo].replies.push(commentDict[c.id])
      })
      comments.sort((a: any, b: any) => b.id - a.id)
      return comments.map((c: any) => commentDict[c.id])
    },
    commentToDeleteList(): any[] {
      return [{ ...this.commentDict[this.commentToDelete.id], replies: [] }]
    },
    currentCommentObject(): any {
      const comment: any = {
        content: markdown(this.comment),
        color: '',
        createdAt: new Date(),
        replies: [],
        author: this.userData ? { ...(this.userMetaLoaded ? this.userMeta : this.userData) } : undefined,
        nickname: this.userData ? undefined : this.nickname,
        id: 0
      }
      if (this.showPreview && this.userData) this.forceRenderScript(comment)
      return comment
    }
  },
  watch: {
    comment() {
      this.commentLeft = true
      this.hasUnsavedDraft = true
    },
    replyToComment(val: number | undefined) {
      if (val) {
        this.chip = true
        this.goTo(this.$refs.commentText as any)
      }
    },
    chip(val: boolean) {
      if (!val) {
        this.replyToComment = undefined
      }
    },
    postData(nv: any, ov: any) {
      this.onExit(ov.id)
      this.cleanUp()
      this.loadDraft(nv.id)
    },
    userData() {
      this.ensureUserMeta()
    }
  },
  mounted() {
    this.loadDraft()
    if (WsBus.globalBus) {
      this.busUnsubscribes.push(WsBus.globalBus.addEventListener('comment_added', (data: any) => {
        const id = data['post_id']
        const commentId = data['comment_id']
        if (id == this.postData.id) this.addCommentById(commentId)
      }))
      this.busUnsubscribes.push(WsBus.globalBus.addEventListener('comment_removed', ({ id }: any) => {
        const previousLength = this.commentList.length
        if (id === this.replyToComment) this.replyToComment = undefined
        this.commentList = this.commentList.filter(x => x.id !== id)
        if (previousLength !== this.commentList.length) --this.commentCount
      }))
    }
  },
  beforeUnmount() {
    this.onExit()
    this.busUnsubscribes.forEach(u => u())
  },
  methods: {
    ...mapActions(useRoseliaStore, ['setCommentDraft', 'removeCommentDraft']),
    getCommentDraft(id: number) {
      const store = useRoseliaStore()
      return store.commentDraft[id]
    },
    goToCommentText() {
      this.goTo(this.$refs.commentText as any)
    },
    onDeleteComment(c: number) {
      this.commentToDelete.id = c
      this.commentToDelete.show = true
    },
    confirmDelete() {
      this.deleteComment(this.commentToDelete.id)
      this.commentToDelete.show = false
      this.commentToDelete.id = 0
    },
    setVisible() { this.visible = true },
    formatDate(d: any) { return utils.formatDate(d) },
    hightlightLanguage() {
      const hljs = (window as any).hljs
      if (hljs) {
        hljs.initHighlighting && (hljs.initHighlighting.called = false)
        hljs.initHighlighting && hljs.initHighlighting()
      }
    },
    addComment() {
      if (!this.isValid || this.loading) return
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('comment', 'add'), 'POST', this.addPostForm)
        .then(mapToCamelCase)
        .then((d: any) => {
          this.toast('Well, you placed a comment!', 'success')
          this.loading = false
          this.removeTokens[d.commentId] = d.removeToken
          this.cachedDraft[d.commentId] = {
            nickname: this.nickname,
            comment: this.comment,
            replyTo: this.replyToComment
          }
          this.removeCommentDraft(this.postData.id)
          this.resetState()
          this.addCommentById(d.commentId)
        }).catch((err: any) => {
          this.toast(err, 'error')
          this.loading = false
        })
    },
    resetState() {
      this.comment = ''
      this.replyToComment = undefined
      this.commentLeft = false
      this.showPreview = false
    },
    cleanComments() {
      this.currentPage = 0
      this.totalPages = 1
      this.commentCount = 0
      this.commentList = []
    },
    cleanUp() {
      this.cleanComments()
      this.resetState()
    },
    deleteComment(cid: number) {
      utils.fetchJSONWithSuccess(utils.apiFor('comment', 'delete'), 'POST', mapToUnderline({
        comment: cid,
        removeToken: this.removeTokens[cid]
      })).then(() => {
        const previousLength = this.commentList.length
        this.commentList = this.commentList.filter(x => x.id !== cid)
        if (previousLength !== this.commentList.length) --this.commentCount
        if (this.commentCount < 0) this.commentCount = this.commentList.length
        this.removeTokens[cid] = undefined
        if (this.cachedDraft[cid]) {
          const { nickname, comment, replyTo } = this.cachedDraft[cid]
          if (!this.comment) {
            this.nickname = nickname
            this.comment = comment
            this.replyToComment = replyTo
          }
          this.cachedDraft[cid] = undefined
        }
      }).catch(() => this.toast('Oops! Failed.', 'error'))
    },
    onReplyComment(cid: number) {
      this.replyToComment = cid
    },
    canDeleteComment(cmt: any): boolean {
      if (this.removeTokens[cmt.id]) return true
      if (!this.isLoggedIn) return false
      if (!cmt.author) return true
      if (cmt.author.username == this.userData.username) return true
      if (!cmt.author.role) return !!this.userData
      return cmt.author.role <= this.userData.role
    },
    loadNextPage() {
      if (this.loading || this.currentPage >= this.totalPages) return
      this.loading = true
      utils.fetchJSON(utils.apiFor('comment', 'comments'), 'GET', {
        p: this.postData.id,
        page: this.currentPage + 1,
        limit: 10
      }).then((data: any) => {
        if (!data.success) return Promise.reject('Invalid postid')
        return data
      }).then((data: any) => {
        this.commentList = this.commentList.concat(data.result.map(mapToCamelCase).map((d: any) => ({
          ...d, showReply: false
        })))
        this.totalPages = data.pages
        this.commentCount = data.total
        ++this.currentPage
        this.loading = false
        this.renderScript()
        this.$nextTick(() => {
          this.processComments()
          this.hasUnsavedDraft = false
        })
      }).catch((err: any) => {
        this.toast(err, 'error')
        this.loading = false
      })
    },
    getComment(cid: number) {
      return this.commentDict[cid]
    },
    getCommentOrNotFound(cid: number): any {
      const result = this.getComment(cid)
      if (!result) this.loadNextPage()
      else return result
      return { id: 0, nickname: 'Anoymous', content: 'This comment is gone.', createdAt: new Date() }
    },
    getCommentNickname(comment: any): string {
      return comment.nickname || safeDictGet('author', 'nickname')(comment)
    },
    processComments(ref?: any) {
      const commentRef: any = ref || (this.$refs.comments as any)?.$el || this.$refs.comments
      if (!commentRef) return
      const links = Array.from(commentRef.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>).filter(e => !!e.href)
      const personalHosts = ['mohuety.com', 'roselia.moe', 'roselia.xyz', 'lisa.moe', 'd4dj.moe'].map(x => new RegExp(x))
      links.filter(e => !e.getAttribute('roselia-prevented'))
        .filter(x => x.host !== location.host && !personalHosts.some(y => y.exec(x.host)))
        .forEach(e => {
          e.setAttribute('roselia-prevented', 'true')
          e.addEventListener('click', ev => {
            ev.preventDefault()
            this.renderer.context.askForAccess(
              e.host,
              `This link wish to visit an unknown host ${e.host}`,
              `The link is ${e.href} please make sure it is safe.`
            ).then(() => window.open(e.href))
          })
        })
      const images = Array.from(commentRef.querySelectorAll('img') as NodeListOf<HTMLImageElement>)
      images.forEach(e => e.classList.add('responsive-img'))
      this.hightlightLanguage()
    },
    renderScript() {
      const leaveCommentMode = this.renderer.enterCommentMode()
      this.commentList.filter(x => x.author).filter(x => !x.rendered).forEach(c => this.forceRenderScript(c))
      leaveCommentMode()
    },
    forceRenderScript(c: any) {
      Object.defineProperty(c, 'id', { value: c.id, writable: false })
      c.author = new Proxy(c.author, {
        set(target, prop, value) {
          if (prop === 'role') return true
          return Reflect.set(target, prop, value)
        }
      })
      const popContext = this.renderer.pushContext(c, 'comment')
      c.cleanedContent = this.renderer.cleanScript(c.content)
      c.content = this.renderer.render(c.content)
      c.rendered = true
      this.renderer.injectEvents()
      popContext()
    },
    onExit(id?: number) {
      if (this.hasUnsavedDraft) {
        this.setCommentDraft({
          commentId: id || this.postData.id,
          comment: { comment: this.comment, nickname: this.nickname }
        })
      }
    },
    loadDraft(id?: number) {
      const draft = this.getCommentDraft(id || this.postData.id)
      if (draft) {
        this.comment = (draft as any).comment || this.comment
        this.nickname = (draft as any).nickname || this.nickname
      }
    },
    ensureUserMeta() {
      if (!this.userData) {
        this.userMetaLoaded = false
        this.userMeta = {}
      }
      if (this.userMetaLoaded && this.userMeta.username === this.userData.username) return
      this.userMetaLoaded = false
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'user-meta'), 'GET', {
        username: this.userData.username
      }).then((data: any) => {
        this.userMeta = mapToCamelCase(data)
        this.userMetaLoaded = true
        if (this.showPreview) {
          this.showPreview = false
          this.$nextTick(() => { this.showPreview = true })
        }
      }).catch(() => {})
    },
    switchPreviewMode() {
      this.showPreview = !this.showPreview
      if (this.showPreview) {
        this.ensureUserMeta()
        this.$nextTick(() => {
          this.processComments((this.$refs.previewComment as any)?.$el || this.$refs.previewComment)
        })
      }
    },
    addCommentById(id: number) {
      if (this.globalAddLock[id]) return
      this.globalAddLock[id] = true
      utils.fetchJSONWithSuccess(utils.apiFor('comment', 'comment', id)).then((data: any) => {
        const comment = mapToCamelCase(data)
        this.commentList = [comment].concat(this.commentList)
        ++this.commentCount
        this.renderScript()
        this.$nextTick(() => this.processComments())
        this.globalAddLock[id] = false
      }).catch(() => { this.globalAddLock[id] = false })
    }
  }
})
</script>
