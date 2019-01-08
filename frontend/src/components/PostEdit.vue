<template>
<div>
  <blog-toolbar :userData="userData"></blog-toolbar>
  <v-container grid-list-md fluid fill-height>
    <v-layout>
      <v-flex xs12 sm8 offset-sm2>
        <h1 class="display-3">{{realTitle}}</h1>
        <v-layout>
              <v-spacer></v-spacer>
              <v-tooltip bottom>
                <v-btn slot="activator" color="secondary" fab small :to="{name: 'post', params: {data: getPreviewData()}}">
                  <v-icon>visibility</v-icon>
                </v-btn>
                <span>Preview the post. Note that the link can be used only once.</span>
              </v-tooltip>
              
            </v-layout>
        <v-form ref="form" v-model="valid">
          <v-text-field
            v-model="postData.title"
            label="Title"
            prepend-icon="title"
            required
            :rules="[v => !!v || 'Title is required']"
          ></v-text-field>
          <v-text-field
            v-model="postData.subtitle"
            label="Subtitle"
            prepend-icon="subtitles"
          ></v-text-field>
          <v-text-field
            v-model="postData.displayId"
            label="Eternal link"
            prepend-icon="link"
          ></v-text-field>
          <span>Language</span>
          <v-switch color="accent"
            :label="markdown ? 'Markdown' : 'HTML'"
            v-model="markdown"
          ></v-switch>
          <v-btn v-if="!markdown && !addPost" color="info" @click="loadContent">Edit raw HTML</v-btn>
          <v-slider
            v-model="postData.secret"
            step="1"
            min="0"
            :max="userData.role + 1"
            ticks
            thumb-label
            label="Secret level"
            :prepend-icon="lockIcon"
          ></v-slider>
          <span>
            <v-icon>visibility{{ postData.hidden ? '_off' : '' }}</v-icon>
            Hidden?
          </span>
          <v-switch color="accent"
            :label="postData.hidden ? 'Hidden' : 'Public'"
            v-model="postData.hidden"
          ></v-switch>
          <span>Comment</span>
          <v-switch color="accent"
            :label="postData.enableComment ? 'Enabled' : 'Disabled'"
            v-model="postData.enableComment"
          ></v-switch>
          <span>Color of Title</span>
          <v-switch color="accent"
            :label="postData.darkTitle ? 'Dark' : 'Light'"
            v-model="postData.darkTitle"
          ></v-switch>
          <v-combobox
            v-model="postData.tags"
            hide-selected
            label="Tags"
            prepend-icon="label"
            multiple
            chips
            deletable-chips
            @input="changeTags"
          >
          </v-combobox>
          <v-text-field
            v-model="postData.img"
            label="Banner Image"
            prepend-icon="image"
          ></v-text-field>
          <span>Content</span>
          <markdown-editor
            @keyup.ctrl.s.prevent="saveDraft"
           id="markdownEditor" ref="markdownEditor" v-model="postData.content" :highlight="true" :configs="configs"></markdown-editor>

          <v-card-actions>
            <v-spacer></v-spacer>
            <div v-if="loading">
              <v-progress-circular
                indeterminate
                color="primary"
              ></v-progress-circular>
            </div>
            <div v-else>
              <v-layout>
                <v-btn v-if="!addPost" color="info" @click="reloadPost">
                  <v-icon>refresh</v-icon>
                </v-btn>
                <v-btn v-if="!addPost" color="error" @click="deleteDialog = true">
                  <v-icon>delete</v-icon>
                </v-btn>
                <v-btn color="secondary" @click="saveDraft" :loading="loading"><v-icon>archive</v-icon></v-btn>
                <v-btn color="primary" v-on:click="doEditPost" :loading="loading" :disabled="!valid"><v-icon>cloud_upload</v-icon></v-btn>
              </v-layout>

            </div>
          </v-card-actions>
        </v-form>
      </v-flex>

    </v-layout>

    <div v-wechat-title="realTitle"></div>
    <v-dialog
      v-model="deleteDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title class="headline">Are you sure?</v-card-title>

        <v-card-text>
          You are deleting {{postData.title}}
          <br/>
          This post will be deleted, and can NOT be undone.
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            color="info"
            flat="flat"
            @click="deleteDialog = false"
          >
            No
          </v-btn>

          <v-btn
            color="error"
            flat="flat"
            @click="deletePost"
            :loading="loading"
          >
            Yes, delete<v-icon>delete</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
  <toast v-bind="toast" @showChange="changeToast"></toast>
  <blog-footer></blog-footer>
</div>
</template>

<script>
import utils from '../common/utils'
import BlogToolbar from './BlogToolbar'
import hljs from 'highlight.js'
import markdownEditor from 'vue-simplemde/src/markdown-editor'
import SimpleMDE from 'simplemde'
import 'simplemde/dist/simplemde.min.css'
import 'github-markdown-css'
import 'highlight.js/styles/xcode.css'

import {mapToCamelCase, mapToUnderline} from '../common/helpers'

window.hljs = hljs

export default {
  components: {BlogToolbar, markdownEditor},
  name: 'post-edit',
  data: () => ({
    postData: {
      img: '',
      id: 0,
      content: '',
      secret: 0,
      title: '',
      subtitle: '',
      hidden: false,
      enableComment: true,
      darkTitle: false,
      displayId: '',
      tags: []
    },
    toast: {
      show: false,
      text: '',
      color: ''
    },
    deleteDialog: false,
    valid: true,
    markdown: true,
    addPost: 0, //
    userData: utils.getLoginData(),
    loading: false,
    configs: {
      spellChecker: false,
      hideIcons: ['guide']
    },
    uploadImages: [],
    doNotSave: false
  }),
  methods: {
    showToast (text, color = 'info') {
      this.toast.text = text
      this.toast.color = color
      this.toast.show = true
    },
    changeToast (show) {
      this.toast.show = show
    },
    makeRedirect (to) {
      utils.setRedirect(this.$route.fullPath)
      utils.redirectTo(to)
    },
    changeTags () {
      this.postData.tags = this.postData.tags.map(t => t.replace(/ /g, '-'))
    },
    getPostNum () {
      return this.$route.query.post
    },
    getPostData () {
      this.changeTags()
      return {
        markdown: this.markdown,
        data: this.postData,
        uploadImages: this.uploadImages
      }
    },
    getPostDraft (pid) {
      return JSON.parse(window.localStorage.getItem(`postDraft#${pid || 0}`))
    },
    saveDraft () {
      window.localStorage.setItem(`postDraft#${this.postData.id || 0}`,
        JSON.stringify(this.getPostData()))
      this.showToast('Draft saved!')
    },
    deleteDraft() {
      window.localStorage.removeItem(`postDraft#${this.postData.id || 0}`)
    },
    getRequestForm () {
      let data = {
        ...this.postData,
        id: undefined,
        next: undefined,
        prev: undefined,
        lastEdit: undefined,
        author: undefined,
        created: undefined
      }
      return {
        postID: this.addPost ? undefined : this.postData.id,
        data: mapToUnderline(data),
        markdown: this.markdown
      }
    },
    loadDraft () {
      let pid = this.getPostNum() || 0
      let dft = this.getPostDraft(pid)
      if (dft) {
        this.markdown = dft.markdown
        this.postData = dft.data
      }
      return !!dft
    },
    preload () {
      let stat = this.loadDraft()
      stat && this.showToast('Draft loaded!')
      return stat
    },
    loadContent () {
      let postNum = this.getPostNum()
      if (!postNum) return
      this.loading = true
      utils.fetchJSON(utils.apiFor('post', postNum), 'GET', {
        markdown: this.markdown
      }).then(data => {
        this.loading = false
        if (!data) {
          this.addPost = true
          return
        }
        this.postData = mapToCamelCase(data)
      }).catch(reason => {
        this.showToast(reason, 'error')
      })
    },
    doEditPost () {
      this.loading = true
      return utils.fetchJSONWithSuccess(utils.apiFor('add'), 'POST', this.getRequestForm()).then(data => {
        this.showToast('Success!', 'success')
        this.leave()
      }).catch(reason => {
        this.$Progress.fail()
        if (reason === 'expired') {
          return utils.refreshToken().then(_ => this.doEditPost()).catch(reason => {
            this.showToast('Token Expired!', 'warning')
            this.makeRedirect({name: 'login'})
          })
        } else {
          this.showToast(reason, 'error')
        }
      }).finally(() => {
        this.deleteDialog = false
        this.loading = false
      })
    },
    deletePost () {
      let pid = this.getPostNum()
      if (!pid) return
      let userData = utils.getLoginData()
      if (!(userData && userData.role)) {
        this.showToast('You are not supposed to do this.', 'warning')
        return
      }
      utils.fetchJSONWithSuccess(utils.apiFor('remove'), 'POST', {
        postID: pid
      }).then(data => {
        this.showToast('Success!', 'success')
        this.leave(true)
      }).catch(reason => {
        if (reason === 'expired') {
          this.showToast('Token Expired!', 'warning')
          this.$router.push({
            'name': 'login'
          })
        } else {
          this.showToast(reason, 'error')
        }
      })
    },
    reloadPost () {
      this.markdown = true
      this.loadContent()
    },
    doNotDelete () {
      this.deleteDialog = false
      this.leave()
    },
    leave (deleteDraft = true) {
      deleteDraft && this.deleteDraft()
      this.doNotSave = deleteDraft
      if (this.$route.params.deletePost) {
        this.$router.go(-1)
      } else {
        utils.redirectTo({
          name: 'index'
        })
      }
    },
    simplemde () {
      let ref = this.$refs.markdownEditor
      return ref ? ref.simplemde : {
        markdown: s => s
      }
    },
    getPreviewData() {
      return {
        ...this.postData,
        id: 'preview',
        content: this.markdown ? this.simplemde().markdown(this.postData.content) : this.postData.content
      }
    }
  },
  computed: {
    realTitle () {
      return this.addPost ? 'Add a post' : `Edit: ${this.postData.title}`
    },
    operationVerb () {
      return this.addPost ? 'add' : 'edit'
    },
    lockIcon () {
      return this.postData.secret ? 'lock' : 'lock_open'
    }
  },
  mounted () {
    if (!this.userData) {
      return this.makeRedirect({
        name: 'login',
        params: {
          logout: true,
          message: `Login to ${this.operationVerb} a post`
        }
      })
    }
    if (!this.userData.role) {
      this.showToast('You are not supposed to do this.')
      utils.redirectTo({name: 'index'})
      return
    }
    if (this.$route.params.deletePost) {
      this.deleteDialog = true
      this.postData.title = this.$route.params.title
      let unwatch = this.$watch('deleteDialog', e => {
        unwatch()
        this.doNotDelete()
      })
      return
    }
    this.addPost = !this.getPostNum()
    let loaded = this.preload()
    if (!loaded && !this.addPost) {
      this.loadContent()
    }
    addEventListener('storage', e => {
      e.key === 'loginData' && (e.newValue || this.makeRedirect({
        name: 'login'
      }))
    })

    window.addEventListener('beforeunload', e => this.saveDraft())
    this.$emit('forceSwitchToLight', true)
  },
  beforeDestroy () {
    if (!this.doNotSave) this.saveDraft()
  },
  destroyed () {
    this.$emit('forceSwitchToLight')
    removeEventListener('beforeunload', e => this.saveDraft())
  }
}
</script>

<style scoped>
</style>
