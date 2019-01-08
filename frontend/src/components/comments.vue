<template>
  <lazy-component text="Load comment">
    <v-container>
      <v-flex v-if="canAddComment" xs10 sm7 offset-sm2>
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
      <v-flex xs10 sm7 offset-sm2>
        <v-timeline dense clipped>
          <v-slide-x-transition
          group
          >
            <v-timeline-item
              v-for="item in commentList"
              :key="item.id"
              class="mb-3"
              :color="item.author ? 'accent' : 'grey'"
              :id="'comment-' + item.id"
            >
              <v-layout justify-space-between>
                
                <v-flex xs7>
                  <v-chip
                    class="white--text ml-0"
                    :color="item.author ? 'secondary' : 'grey'"
                    label
                    small
                  >
                    {{ item.nickname || item.author.nickname }}
                  </v-chip>
                  <v-card
                    class="mt-3 mx-auto"
                    v-if="item.replyTo"
                    @click="$vuetify.goTo('#comment-' + getCommentOrNotFound(item.replyTo).id)"
                  >
                    <v-card-text class="pt-0">
                      <div class="title font-weight-light mb-2">@{{ getCommentNickname(getCommentOrNotFound(item.replyTo)) }}</div>
                      <div class="subheading font-weight-light grey--text" v-html="getCommentOrNotFound(item.replyTo).content"></div>
                      <v-divider class="my-2"></v-divider>
                      <v-icon
                        class="mr-2"
                        small
                      >
                        mdi-clock
                      </v-icon>
                      <span class="caption grey--text font-weight-light">{{ formatDate(getCommentOrNotFound(item.replyTo).createdAt) }}</span>
                    </v-card-text>
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
        <div>
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
          
        </div>
      </v-layout>
    </v-container>
    
  </lazy-component>
</template>
<script>
import lazyComponent from './lazyComponent'
import { mapToUnderline, mapToCamelCase, safeDictGet } from '@/common/helpers';
import utils from '@/common/utils';
export default {
  components: {lazyComponent},
  props: ['userData', 'postData', 'toast'],
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
      commentList: [],
      replyToComment: undefined
    }
  },
  methods: {
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
      })
    },
    canDeleteComment(cmt) {
      if (!this.isLoggedIn) return false
      if (!cmt.author) return true
      return cmt.author.role <= this.userData.role
    },
    loadNextPage() {
      if (this.loading) return
      this.loading = true
      utils.fetchJSON(utils.apiFor('comment', 'comments'), 'GET', {
        p: this.postData.id,
        page: this.currentPage + 1,
        limit: 10
      }).then(data => {
        if (!data.success) return Promise.reject('Invalid postid')
        return data
      }).then(data => {
        this.commentList = this.commentList.concat(data.result.map(mapToCamelCase))
        this.totalPages = data.pages
        ++this.currentPage
        this.loading = false
      }).catch(err => {
        this.toast(err, 'error')
        this.loading = false
      })
    },
    getComment(cid) {
      return this.commentDict[cid]
    },
    getCommentOrNotFound(cid) {
      return this.getComment(cid) || {
        id: 0,
        nickname: 'Anoymous',
        content: 'This comment is gone.',
        createdAt: new Date
      }
    },
    getCommentNickname(comment) {
      return comment.nickname || safeDictGet('author', 'nickname')(comment)
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
    postData() {
      this.cleanUp()
    }
  }
}
</script>
