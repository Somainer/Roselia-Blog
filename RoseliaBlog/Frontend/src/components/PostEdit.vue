<template>
<div>
  <blog-toolbar :userData="userData"></blog-toolbar>
  <v-container grid-list-md fluid fill-height>
    <v-row>
      <v-col cols="12" sm="8" offset-sm="2">
        <h1 class="display-3">{{realTitle}}</h1>
        <v-layout>
          <v-spacer></v-spacer>
          <v-btn class="ma-2" fab small @click="switchDarkMode">
            <v-icon>{{ currentColorScheme ? 'wb_sunny' : 'nights_stay' }}</v-icon>
          </v-btn>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" class="ma-2" color="secondary" fab small :to="{name: 'post', params: {data: getPreviewData()}}">
                <v-icon>visibility</v-icon>
              </v-btn>
            </template>
            <span>Preview the post. Note that the link can be used only once.</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" class="ma-2" color="accent" fab small :to="{name: 'postLivePreview', params: {previewPostId: postData.id || 0}}" target="_blank">
                <v-icon>preview</v-icon>
              </v-btn>
            </template>
            <span>Live Preview</span>
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
          <span>
            <v-icon>fab fa-{{ markdown ? 'markdown' : 'html5' }}</v-icon>
            Language
          </span>
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
          <v-row>
            <v-col>
              <span>
                <v-icon>visibility{{ postData.hidden ? '_off' : '' }}</v-icon>
                Hidden?
              </span>
              <v-switch color="accent"
                :label="postData.hidden ? 'Hidden' : 'Public'"
                v-model="postData.hidden"
              ></v-switch>
            </v-col>
            <v-col>
              <span>Comment</span>
              <v-switch color="accent"
                :label="postData.enableComment ? 'Enabled' : 'Disabled'"
                v-model="postData.enableComment"
              ></v-switch>
            </v-col>
            <v-col>
              <span>Color of Title</span>
              <v-switch color="accent"
                :label="postData.darkTitle ? 'Dark' : 'Light'"
                v-model="postData.darkTitle"
              ></v-switch>
            </v-col>
          </v-row>
          <v-btn round @click="explorerOpen = true" color="primary" v-if="richPostExtensions.length">
            +<v-icon>extension</v-icon>Plugins
          </v-btn>
          <v-row>
            <v-select
              label="Image Upload Channel"
              :loading="imageUpload.loading"
              :items="imageUpload.channels"
              v-model="imageUpload.channel"
              prepend-icon="camera_roll"
            ></v-select>
            <v-checkbox label="To Webp" v-model="imageUpload.convertToWebp"></v-checkbox>
          </v-row>
          <v-row v-if="uploadImages.length">
            <v-row>
              <span>Uploaded Images</span>
            </v-row>
            <uploaded-images v-model="uploadImages" :notify="showToast"></uploaded-images>
          </v-row>
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
          <v-row>
            <v-col :cols="3">
              <v-select
                :items="availableEditors"
                v-model="currentEditor"
                label="Editor"
              ></v-select>
            </v-col>
            <v-col
              v-if="currentEditor === 'easymde'"
            >
              <span>Paste Option</span>
              <v-switch color="accent"
                :label="pasteHtml ? 'HTML' : 'Plain Text'"
                v-model="pasteHtml"></v-switch>
            </v-col>
          </v-row>
          <span>Content</span>
          <editor-switcher 
            :editor="currentEditor"
            v-model="postDataContent"
            :useMarkdown="markdown"
            :dark="!currentColorScheme"
            :postPageActionBus="postPageActionBus"
            :pasteHtml="pasteHtml"
          />

          <v-card-actions>
            <v-spacer></v-spacer>
            <div v-if="loading">
              <v-progress-circular
                indeterminate
                color="primary"
              ></v-progress-circular>
            </div>
            <div v-else>
              <div>
                <v-btn class="ma-1" v-if="!addPost" color="info" @click="reloadPost">
                  <v-icon>refresh</v-icon>
                </v-btn>
                <v-btn class="ma-1" v-if="!addPost" color="error" @click="deleteDialog = true">
                  <v-icon>delete</v-icon>
                </v-btn>
                <v-btn class="ma-1" color="secondary" @click="saveDraft" :loading="loading"><v-icon>archive</v-icon></v-btn>
                <v-btn class="ma-1" color="primary" v-on:click="doEditPost" :loading="loading" :disabled="!valid">
                  <v-icon>cloud_upload</v-icon>
                 <span v-if="!isMobile">({{commandText}}+Shift+S)</span>
                </v-btn>
              </div>
            </div>
          </v-card-actions>
        </v-form>
      </v-col>

    </v-row>

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
    <plugin-explorer v-model="explorerOpen" :plugins="richPostExtensions.map(p => ({name: p.name, component: p.editPage}))"></plugin-explorer>

  </v-container>
  <toast v-bind="toast" @showChange="changeToast"></toast>
  <GlobalEvents
    v-if="isMac"
    @keyup.meta.83.prevent.capture="doEditPost"
  />
  <GlobalEvents
    @keyup.ctrl.83.prevent.capture="doEditPost"
  />
  <blog-footer></blog-footer>
</div>
</template>

<script>
import utils from '../common/utils'
import BlogToolbar from './BlogToolbar'
// import hljs from 'highlight.js'
import 'github-markdown-css'
// import 'highlight.js/styles/vs.css'
import 'highlight.js/styles/xcode.css'
import {platform} from '../common/platform'
import GlobalEvents from 'vue-global-events'

import {mapToCamelCase, mapToUnderline} from '../common/helpers'
import PluginExplorer from './EditPluginExplorer'
import {plugins} from '../plugins/RoseliaPluginHost'
import {pushContext, flushContext} from '../custom-command/luis'
import { getImageChannels, uploadImage } from '../common/api/images'
import UploadedImages from './UploadedImages'
import { markdownAsync, markdown } from '../common/roselia-markdown'

import { debounce, throttle } from '../common/fake-lodash'
// window.hljs = hljs
// window.platform = platform

import { EditorSwitcher } from '../common/rich-editor/editor-switcher'

export default {
  components: {BlogToolbar, PluginExplorer, GlobalEvents, UploadedImages, EditorSwitcher},
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
    loading: false,
    configs: {
      spellChecker: false,
      hideIcons: ['guide']
    },
    uploadImages: [],
    doNotSave: false,
    explorerOpen: false,
    imageUpload: {
      channel: 'roselia',
      channels: [],
      loading: true,
      convertToWebp: false
    },
    pasteHtml: false,
    availableEditors: EditorSwitcher.availableEditors,
    currentEditor: EditorSwitcher.defaultEditor
  }),
  props: {
    userData: Object,
    currentColorScheme: Boolean
  },
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
        uploadImages: this.uploadImages,
        editor: this.currentEditor
      }
    },
    getPostDraft (pid) {
      return JSON.parse(window.localStorage.getItem(`postDraft#${pid || 0}`))
    },
    saveDraft (doNotShow = false) {
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
        this.uploadImages = dft.uploadImages || []
        this.currentEditor = dft.editor || this.currentEditor
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
    doEditPost (shouldRedirect = true) {
      if(!this.valid) return
      this.loading = true
      return utils.fetchJSONWithSuccess(utils.apiFor('add'), 'POST', this.getRequestForm()).then(data => {
        this.showToast('Post Saved', 'success')
        if (shouldRedirect || this.addPost) this.leave()
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
    getPreviewData() {
      return {
        ...this.postData,
        id: 'preview',
        content: this.markdown ? markdown(this.postData.content) : this.postData.content,
        markdownContent: this.markdown ? this.postData.content : undefined
      }
    },
    switchDarkMode() {
      const isLight = this.currentColorScheme
      const shouldBeLight = !isLight
      this.$emit('forceSwitchToLight', !!shouldBeLight)
      this.$emit('forceSwitchToDark', !shouldBeLight)
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
    },
    isMac() {
      return platform.macOS
    },
    isMobile() {
      return platform.mobile
    },
    commandText() {
      return this.isMac ? '⌘' : 'Ctrl'
    },
    richPostExtensions() {
      return plugins.richPostPlugin
    },
    postDataContent: {
      get() {
        return this.postData.content
      },
      set(value) {
        this.postData.content = value
      }
    },
    postPageActionBus() {
      /** @type {IRoseliaEditPageActionBus} */
      const actionBus = {
        save: this.doEditPost,
        goToPreview: () => {
          this.$router.push({name: 'post', params: {data: this.getPreviewData()}})
        },
        goToLivePreview: () => {
          window.open(this.$router.resolve({name: 'postLivePreview', params: {previewPostId: this.postData.id || 0}}).href, '_blank')
        },
        uploadImage: async (image, origionalUrl) => {
          const placeHolder = {
            url: origionalUrl,
            channel: this.imageUpload.channel,
            loading: true,
            fileName: 'Uploading...'
          }

          try {
            this.uploadImages = [...this.uploadImages, placeHolder]
            const uploaded = await uploadImage(image, this.imageUpload.channel, this.imageUpload.convertToWebp ? 'webp' : undefined)
            if (!uploaded.success) throw new Error(uploaded.msg);
            this.uploadImages = this.uploadImages.map(x => {
              if (x === placeHolder) return uploaded.result
              return x
            })
            return uploaded.result;
          } catch (error) {
            this.showToast(error, 'error')
            this.uploadImages = this.uploadImages.filter(x => x !== placeHolder)
          }
        }
      }
      return actionBus
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

    window.addEventListener('beforeunload', this.saveDraft)
    // this.$emit('forceSwitchToLight', true)
    pushContext({
      "Utilities.FinishTask": this.doEditPost,
      "Utilities.Confirm": this.doEditPost,
      "Utilities.Cancel": this.leave,
      save: this.doEditPost
    }, this)
    getImageChannels().then(channels => {
      this.imageUpload.channels = channels.map(c => ({
        text: `${c.name} - ${c.description}`,
        value: c.id
      }))
      this.imageUpload.loading = false;
    })
  },
  watch: {
    userData(val) {
      if(!val) this.makeRedirect({
        name: 'login'
      })
    },
    postDataContent: {
      handler: debounce(function () {
        this.saveDraft()
      }, 500),
      deep: true
    }
  },
  beforeDestroy () {
    if (!this.doNotSave) this.saveDraft()
  },
  destroyed () {
    this.$emit('forceSwitchToLight')
    window.removeEventListener('beforeunload', this.saveDraft)
    flushContext()
  }
}
</script>

<style scoped>
</style>
