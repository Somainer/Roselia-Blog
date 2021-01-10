<template>
  <lazy-component text="Load comment">
    <v-container>
      <v-col cols="12" sm="8" offset-sm="2">
        <v-badge :value="commentCount">
          <span slot="badge">{{commentCount}}</span>
          <v-icon>
            mode_comment
          </v-icon>
        </v-badge>
        <v-divider class="my-3"></v-divider>
      </v-col>
      <v-col v-if="canAddComment" cols="12" sm="8" offset-sm="2">
        <v-row row wrap>
          <v-chip close color="secondary" dark v-if="replyToComment" v-model="chip" @click:close="chip = false">
            @{{ atToNickname }}
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn color="accent" @click="switchPreviewMode" icon>
            <v-icon v-if="showPreview">mode_edit</v-icon>
            <v-icon v-else>visibility</v-icon>
          </v-btn>
        </v-row>
        <div v-if="showPreview">
          <recursive-comment
            ref="previewComment"
            :comments="[currentCommentObject]"
            :canAddComment="false"
            :canDeleteComment="() => false"
            :myUsername="userData && userData.username"
          ></recursive-comment>
        </div>
        <v-textarea
                v-model="comment"
                auto-grow
                outlined
                :placeholder="commentPlaceholer"
                color="primary"
                label="Leave a comment"
                ref="commentText"
                @keyup.meta.enter="addComment"
                @keyup.ctrl.enter="addComment"
                v-else
        ></v-textarea>
        <v-row row wrap>
          <v-col cols="4">
            <span v-if="userData && userData.nickname">{{ userData.nickname }}</span>
            <v-text-field small v-else v-model="nickname" label="Nickname"></v-text-field>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="3" md="2" lg="1">
            <v-btn color="primary" :disabled="!this.isValid" :loading="loading" @click="addComment"
                   rounded
            >
              <v-icon>send</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
      <recursive-comment ref="comments"
        :comments="recursiveCommentList" 
        :canAddComment="canAddComment"
        :canDeleteComment="canDeleteComment"
        @delete-comment="c => { commentToDelete.id = c; commentToDelete.show = true }"
        @reply-comment="onReplyComment"
        :postAuthorUsername="postData.author && postData.author.username"
        :myUsername="userData && userData.username"
      ></recursive-comment>
      <v-row
          align="center"
          column
          justify="center"
          dense
        >
        <v-col cols="2" class="text-center">
          <v-chip
                  class="white--text ml-0 center-align"
                  color="secondary"
                  small
                  @click="$vuetify.goTo($refs.commentText)"
          >
            <v-icon>add_comment</v-icon>
          </v-chip>
          <div v-if="currentPage < totalPages" v-observe-visibility="loadNextPage">
            <v-btn :loading="loading" small @click="loadNextPage" block color="secondary" dark>
              <v-icon>keyboard_arrow_down</v-icon>
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

    <v-dialog
      v-model="commentToDelete.show"
      max-width="500"
      scrollable
    >
      <v-card>
        <v-card-title class="headline">Are you sure?</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          You are deleting this comment:
          <br/>
          <recursive-comment
            :comments="commentToDeleteList" 
            :canAddComment="false"
            :canDeleteComment="() => false"
          ></recursive-comment>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
                  color="info"
                  text
                  @click="commentToDelete.show = false"
          >
            No
          </v-btn>

          <v-btn
                  color="error"
                  text
                  @click="() => {deleteComment(commentToDelete.id); commentToDelete.show = false; commentToDelete.id = 0}"
          >
            Yes, delete<v-icon>delete</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
  </lazy-component>
</template>
<script>
import {mapState, mapGetters, mapMutations} from 'vuex'
import lazyComponent from './lazyComponent'
import { mapToUnderline, mapToCamelCase, safeDictGet } from '@/common/helpers';
import recursiveComment from './RecursiveComments'
import utils from '@/common/utils';
import M from 'materialize-css'
import { markdown } from '../common/roselia-markdown'
import WsBus from '../plugins/ws-bus'
export default {
  components: {lazyComponent, recursiveComment},
  props: ['userData', 'postData', 'toast', 'renderer'],
  name: 'blog-comment',
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
      commentList: [],
      replyToComment: undefined,
      hasUnsavedDraft: false,
      commentToDelete: {
        id: 0,
        show: false
      },
      removeTokens: {

      },
      cachedDraft: {},
      userMeta: {},
      userMetaLoaded: false,
      showPreview: false,
      globalAddLock: {} // Designed to prevent duplicate adds.
    }
  },
  methods: {
    ...mapMutations([
      'setCommentDraft',
      'removeCommentDraft'
    ]),
    getCommentDraft(id) {
      return this.$store.state.commentDraft[id]
    },
    setVisible() {
      this.visible = true
    },
    formatDate(d) {
      return utils.formatDate(d)
    },
    hightlightLanguage() {
      if (window.hljs) {
        window.hljs.initHighlighting.called = false
        window.hljs.initHighlighting()
      }
    },
    addComment() {
      if (!this.isValid || this.loading) return;
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('comment', 'add'), 'POST', this.addPostForm).then(mapToCamelCase).then(d => {
        this.toast('Well, you placed a comment!', 'success')
        this.loading = false
        this.removeTokens[d.commentId] = d.removeToken
        this.cachedDraft[d.commentId] = {
          nickname: this.nickname,
          comment: this.comment,
          replyTo: this.replyToComment
        }
        this.removeCommentDraft(this.postData.id)
        // this.cleanUp()
        // this.loadNextPage()
        this.resetState()
        this.addCommentById(d.commentId)
      }).catch(err => {
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
    deleteComment(cid) {
      utils.fetchJSONWithSuccess(utils.apiFor('comment', 'delete'), 'POST', mapToUnderline({
        comment: cid,
        removeToken: this.removeTokens[cid]
      })).then(succ => {
        const previousLength = this.commentList.length
        this.commentList = this.commentList.filter(x => x.id !== cid)
        if(previousLength !== this.commentList.length) {
          --this.commentCount
        }
        if (this.commentCount < 0) this.commentCount = this.commentList.length
        this.removeTokens[cid] = undefined
        if(this.cachedDraft[cid]) {
          const {nickname, comment, replyTo} = this.cachedDraft[cid]
          if(!this.comment) {
            this.nickname = nickname
            this.comment = comment
            this.replyToComment = replyTo
          }
          this.cachedDraft[cid] = undefined
        }
      }).catch(err => {
        this.toast('Oops! Failed.', 'error')
      })
    },
    onReplyComment(cid) {
      this.replyToComment = cid
    },
    canDeleteComment(cmt) {
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
      }).then(data => {
        if (!data.success) return Promise.reject('Invalid postid')
        return data
      }).then(data => {
        this.commentList = this.commentList.concat(data.result.map(mapToCamelCase).map(d => ({
          ...d,
          showReply: false
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
      }).catch(err => {
        this.toast(err, 'error')
        this.loading = false
      })
    },
    getComment(cid) {
      return this.commentDict[cid]
    },
    getCommentOrNotFound(cid) {
      const result = this.getComment(cid) 
      if(!result) {
        this.loadNextPage()
      } else {
        return result
      }
      return {
        id: 0,
        nickname: 'Anoymous',
        content: 'This comment is gone.',
        createdAt: new Date
      }
    },
    getCommentNickname(comment) {
      return comment.nickname || safeDictGet('author', 'nickname')(comment)
    },
    processComments(ref) {
      const commentRef = ref || this.$refs.comments.$el || this.$refs.comments
      const links = Array.from(commentRef.querySelectorAll('a')).filter(e => !!e.href)
      const personalHosts = [
        'mohuety.com', 'roselia.moe', 'roselia.xyz', 'lisa.moe', 'd4dj.moe'
      ].map(x => new RegExp(x))
      links.filter(e => !e.getAttribute('roselia-prevented')).filter(x => x.host !== location.host && !personalHosts.some(y => y.exec(x.host))).forEach(async e => {
        e.setAttribute('roselia-prevented', true)
        e.addEventListener('click', ev => {
          ev.preventDefault()
          this.renderer.context.askForAccess(e.host, `This link wish to visit an unknown host ${e.host}`,
           `The link is ${e.href} please make sure it is safe.`).then(() => {
            window.open(e.href)
          })
        })
      })
      const selectedImages = commentRef.querySelectorAll('img')
      const images = Array.from(selectedImages)
      images.forEach(e => {
        e.classList.add('responsive-img')
      })
      M.Materialbox.init(selectedImages)
      this.hightlightLanguage()
    },
    renderScript() {
      const leaveCommentMode = this.renderer.enterCommentMode();
      this.commentList.filter(x => x.author).filter(x => !x.rendered).forEach(c => {
        this.forceRenderScript(c)
      })
      leaveCommentMode();
    },
    forceRenderScript(c) {
      Object.defineProperty(c, 'id', {
        value: c.id,
        writable: false
      })
      c.author = new Proxy(c.author, {
        set(target, prop, value) {
          if (prop === 'role') return
          return Reflect.set(target, prop, value)
        }
      })
      const popContext = this.renderer.pushContext(c, 'comment')
      c.cleanedContent = this.renderer.cleanScript(c.content)
      const renderResult = this.renderer.render(c.content)
      c.content = renderResult
      c.rendered = true
      this.renderer.injectEvents()
      popContext()
    },
    onExit(id) {
      if(this.hasUnsavedDraft) {
        this.setCommentDraft({
          commentId: id || this.postData.id,
          comment: {
            comment: this.comment,
            nickname: this.nickname
          }
        })
      }
    },
    loadDraft(id) {
      const draft = this.getCommentDraft(id || this.postData.id)
      if (draft) {
        this.comment = draft.comment || this.comment
        this.nickname = draft.nickname || this.nickname
      }
    },
    ensureUserMeta() {
      if(!this.userData) {
        this.userMetaLoaded = false
        this.userMeta = {}
      }
      if(this.userMetaLoaded && this.userMeta.username === this.userData.username) return
      this.userMetaLoaded = false
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'user-meta'), 'GET', {
        username: this.userData.username
      }).then(data => {
        this.userMeta = mapToCamelCase(data)
        this.userMetaLoaded = true
        if(this.showPreview) {
          this.showPreview = false
          this.$nextTick(() => {
            this.showPreview = true
          })
        }
      }).catch(err => {
        
      })
    },
    switchPreviewMode() {
      this.showPreview = !this.showPreview
      if(this.showPreview) {
        this.ensureUserMeta()
        this.$nextTick(() => {
          this.processComments(this.$refs.previewComment.$el || this.$refs.previewComment)
        })
      }
    },
    highlightLanguage () {
      if (window.hljs) {
        window.hljs.initHighlighting.called = false
        window.hljs.initHighlighting()
      }
    },
    addCommentById(id) {
      if (this.globalAddLock[id]) return;
      this.globalAddLock[id] = true;
      utils.fetchJSONWithSuccess(utils.apiFor('comment', 'comment', id)).then(data => {
        const comment = mapToCamelCase(data)
        this.commentList = [comment].concat(this.commentList)
        ++this.commentCount;
        this.renderScript()
        this.$nextTick(() => {
          this.processComments()
        })
        this.globalAddLock[id] = false
      }).catch(err => {
        this.globalAddLock[id] = false
      })
    }
  },
  computed: {
    commentPlaceholer() {
      return this.commentLeft ? `It is fine to keep silent, dear ${this.currentNickname}.` : 'Say something.'
    },
    currentNickname() {
      return (this.userData && this.userData.nickname) || this.nickname
    },
    isValid() {
      return this.comment && this.currentNickname
    },
    isLoggedIn() {
      return !!this.userData
    },
    addPostForm() {
      return mapToUnderline({
        toPost: this.postData.id,
        content: this.comment,
        nickname: this.isLoggedIn ? undefined : this.currentNickname,
        toComment: this.replyToComment || undefined
      })
    },
    canAddComment() {
      return !!(this.userData || this.postData.enableComment)
    },
    commentDict() {
      return this.commentList.reduce((acc, cmt) => ({
        ...acc,
        [cmt.id]: cmt
      }), {})
    },
    atToNickname() {
      const comment = this.getComment(this.replyToComment)
      return comment && this.getCommentNickname(comment)
    },
    recursiveCommentList() {
      const commentDict = this.commentDict
      const comments = this.commentList.filter(c => !c.replyTo).concat(
        this.commentList.filter(c => c.replyTo).filter(c => !commentDict[c.replyTo]).map(c => {
          const comment = {
            ...this.getCommentOrNotFound(c.replyTo),
            id: c.replyTo
          }
          return commentDict[c.replyTo] = comment
        })
      )
      Object.entries(commentDict).forEach(([k, v]) => {
        commentDict[k] = {
          ...v,
          replies: []
        }
      })
      this.commentList.forEach(c => {
        if(c.replyTo) {
          commentDict[c.replyTo].replies.push(commentDict[c.id])
        }
      })
      comments.sort((a, b) => b.id - a.id)
      return comments.map(c => commentDict[c.id])
    },
    commentToDeleteList() {
      return [
        {
          ...this.commentDict[this.commentToDelete.id],
          replies: []
        }
      ]
    },
    currentCommentObject() {
      const comment = {
        content: markdown(this.comment),
        color: '',
        createdAt: new Date,
        replies: [],
        author: this.userData ? {...(this.userMetaLoaded ? this.userMeta : this.userData)} : undefined,
        nickname: this.userData ? undefined : this.nickname,
        id: 0
      }
      if(this.showPreview && this.userData) this.forceRenderScript(comment)
      return comment
    }
  },
  watch: {
    comment() {
      this.commentLeft = true
      this.hasUnsavedDraft = true
    },
    replyToComment(val) {
      if(val) {
        this.chip = true
        this.$vuetify.goTo(this.$refs.commentText)
      }
    },
    chip (val) {
      if(!val) {
        this.replyToComment = undefined
        this.$vuetify.goTo('#comment-' + this.replyToComment)
      }
    },
    postData(nv, ov) {
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
    
    if(WsBus.globalBus) {
      this.$once('destroyed', WsBus.globalBus.addEventListener('comment_added', data => {
        const id = data['post_id']
        const commentId = data['comment_id']
        if (id == this.postData.id) {
          this.addCommentById(commentId)
        }
      }))

      this.$once('destroyed', WsBus.globalBus.addEventListener('comment_removed', ({id}) => {
        const previousLength = this.commentList.length
        if(id === this.replyToComment) {
          this.replyToComment = undefined
        }
        this.commentList = this.commentList.filter(x => x.id !== id)
        if (previousLength !== this.commentList.length) {
          --this.commentCount
        }
      }))
    }
  },
  beforeDestroy() {
    this.onExit()
  }
}
</script>
