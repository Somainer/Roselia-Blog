<template>
  <lazy-component text="Load comment">
    <v-container>
      <v-flex v-if="canAddComment" xs10 sm7 offset-sm2>
        <v-badge>
          <span slot="badge" v-if="commentCount">{{commentCount}}</span>
          <v-icon>
            mode_comment
          </v-icon>
        </v-badge>
        <v-divider class="my-3"></v-divider>
        <v-chip close color="secondary" dark v-if="replyToComment" v-model="chip">
          @{{ atToNickname }}
        </v-chip>
        <v-textarea
          v-model="comment"
          auto-grow
          outline
          :placeholder="commentPlaceholer"
          color="primary"
          label="Leave a comment"
          ref="commentText"
        ></v-textarea>
        <v-layout row wrap>
          <v-flex xs4>
            <span v-if="userData && userData.nickname">{{ userData.nickname }}</span>
            <v-text-field small v-else v-model="nickname" label="Nickname"></v-text-field>
          </v-flex>
          <v-spacer></v-spacer>
          <v-flex xs2>
            <v-btn color="primary" :disabled="!this.isValid" :loading="loading" @click="addComment">
              <v-icon>send</v-icon>
            </v-btn>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex xs10 sm7 offset-sm2 ref="comments">
        <v-timeline dense clipped>
          <v-slide-x-transition
          group
          >
            <v-timeline-item
              v-for="item in commentList"
              :key="item.id"
              class="mb-3"
              :color="item.color || (item.author ? 'accent' : '#bbbbbb')"
              :id="'comment-' + item.id"
            >
              <v-layout justify-space-between>
                
                <v-flex xs7>
                  <v-chip
                    class="white--text ml-0"
                    :color="item.color || (item.author ? 'secondary' : '#bbbbbb')"
                    label
                    small
                  >
                    {{ item.nickname || item.author.nickname }}
                  </v-chip>
                  <v-card
                    class="mt-3 mx-auto"
                    v-if="item.replyTo"
                  >
                    <v-card-title>
                      <div class="title font-weight-light mb-2">@{{ getCommentNickname(getCommentOrNotFound(item.replyTo)) }}</div>
                    </v-card-title>
                    <v-slide-y-transition>
                      <v-card-text class="pt-0" v-show="item.showReply">
                        <div class="subheading font-weight-light grey--text" 
                          v-html="getCommentOrNotFound(item.replyTo).cleanedContent || getCommentOrNotFound(item.replyTo).content"
                        ></div>
                      </v-card-text>
                    </v-slide-y-transition>
                    
                    <v-divider class="my-2"></v-divider>
                    <v-card-actions>
                      <v-btn flat icon small @click="item.showReply = !item.showReply">
                        <v-icon>keyboard_arrow_{{ item.showReply ? 'up' : 'down'}}</v-icon>
                      </v-btn>
                      <v-btn flat icon small @click="$vuetify.goTo('#comment-' + getCommentOrNotFound(item.replyTo).id)">
                        <v-icon>mode_comment</v-icon>
                      </v-btn>
                      <v-spacer></v-spacer>
                      <v-icon
                        class="mr-2"
                      >
                        date_range
                      </v-icon>
                      <span class="caption grey--text font-weight-light">{{ formatDate(getCommentOrNotFound(item.replyTo).createdAt) }}</span>
                    </v-card-actions>
                  </v-card>
                  <div v-html="item.content"></div>
                  <v-btn flat icon @click="replyToComment = item.id" v-if="canAddComment">
                    <v-icon>reply</v-icon>
                  </v-btn>
                </v-flex>
                <v-flex xs5 text-xs-right>
                  {{ formatDate(item.createdAt) }}
                  <v-btn fab color="error" small @click="deleteComment(item.id)" v-if="canDeleteComment(item)">
                    <v-icon>delete</v-icon>
                  </v-btn>
                </v-flex>
              </v-layout>
            </v-timeline-item>
          </v-slide-x-transition>

        </v-timeline>
      </v-flex>
      <v-layout
          align-center
          column
          justify-center
        >
        <v-chip
          class="white--text ml-0 center-align"
          color="secondary"
          label
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
          Tiro finale
        </div>
          
      </v-layout>
    </v-container>
    
  </lazy-component>
</template>
<script>
import {mapState, mapGetters, mapMutations} from 'vuex'
import lazyComponent from './lazyComponent'
import { mapToUnderline, mapToCamelCase, safeDictGet } from '@/common/helpers';
import utils from '@/common/utils';
import M from 'materialize-css'
export default {
  components: {lazyComponent},
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
      hasUnsafedDraft: false
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
    addComment() {
      this.loading = true
      utils.fetchJSONWithSuccess(utils.apiFor('comment', 'add'), 'POST', this.addPostForm).then(d => {
        this.toast('Well, you placed a comment!', 'success')
        this.loading = false
        this.removeCommentDraft(this.postData.id)
        this.cleanUp()
        this.loadNextPage()
      }).catch(err => {
        this.toast(err, 'error')
        this.loading = false
      })
    },
    cleanUp() {
      this.currentPage = 0
      this.totalPages = 1
      this.commentCount = 0
      this.commentList = []
      this.comment = ''
      this.replyToComment = undefined
      this.commentLeft = false
    },
    deleteComment(cid) {
      utils.fetchJSONWithSuccess(utils.apiFor('comment', 'delete'), 'POST', {
        comment: cid
      }).then(succ => {
        this.commentList = this.commentList.filter(x => x.id !== cid)
        --this.commentCount
      }).catch(err => {
        this.toast('Oops! Failed.', 'error')
      })
    },
    canDeleteComment(cmt) {
      if (!this.isLoggedIn) return false
      if (!cmt.author) return true
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
          this.hasUnsafedDraft = false
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
    processComments() {
      const links = Array.from(this.$refs.comments.querySelectorAll('a')).filter(e => !!e.href)
      const personalHosts = [
        'mohuety.com', 'roselia.moe', 'roselia.xyz', 'lisa.moe', 'roselia.app'
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
      const selectedImages = this.$refs.comments.querySelectorAll('img')
      const images = Array.from(selectedImages)
      images.forEach(e => {
        e.classList.add('responsive-img')
      })
      M.Materialbox.init(selectedImages)
    },
    renderScript() {
      this.commentList.filter(x => x.author).filter(x => !x.rendered).forEach(c => {
        const popContext = this.renderer.pushContext(c, 'comment')
        c.cleanedContent = this.renderer.cleanScript(c.content)
        const renderResult = this.renderer.render(c.content)
        c.content = renderResult
        c.rendered = true
        this.renderer.injectEvents()
        popContext()
      })
    },
    onExit(id) {
      if(this.hasUnsafedDraft) {
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
      return this.userData || this.postData.enableComment
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
    }
  },
  watch: {
    comment() {
      this.commentLeft = true
      this.hasUnsafedDraft = true
    },
    replyToComment(val) {
      if(val) {
        this.$vuetify.goTo(this.$refs.commentText)
        this.chip = true
      }
    },
    chip (val) {
      if(!val) {
        this.$vuetify.goTo('#comment-' + this.replyToComment)
        this.replyToComment = undefined
      }
    },
    postData(nv, ov) {
      this.onExit(ov.id)
      this.cleanUp()
      this.loadDraft(nv.id)
    }
  },
  mounted() {
    this.loadDraft()
  },
  beforeDestroy() {
    this.onExit()
  }
}
</script>
