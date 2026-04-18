<template>
  <div>
    <blog-toolbar :user-data="userData"></blog-toolbar>
    <v-container fluid class="fill-height">
      <v-row>
        <v-col cols="12" sm="8" offset-sm="2">
          <h1 class="text-h3">{{ realTitle }}</h1>
          <v-row>
            <v-spacer></v-spacer>
            <v-btn class="ma-2" size="small" icon @click="switchDarkMode">
              <v-icon>{{ currentColorScheme ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
            </v-btn>
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  class="ma-2"
                  color="secondary"
                  size="small"
                  icon="mdi-eye"
                  :to="{ name: 'post', params: { data: getPreviewData() } }"
                ></v-btn>
              </template>
              <span>Preview the post. Note that the link can be used only once.</span>
            </v-tooltip>
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  class="ma-2"
                  color="accent"
                  size="small"
                  icon="mdi-magnify"
                  :to="{ name: 'postLivePreview', params: { previewPostId: postData.id || 0 } }"
                  target="_blank"
                ></v-btn>
              </template>
              <span>Live Preview</span>
            </v-tooltip>
          </v-row>
          <v-form ref="form" v-model="valid">
            <v-text-field v-model="postData.title" label="Title" prepend-icon="mdi-format-title" required :rules="[v => !!v || 'Title is required']"></v-text-field>
            <v-text-field v-model="postData.subtitle" label="Subtitle" prepend-icon="mdi-subtitles"></v-text-field>
            <v-text-field v-model="postData.displayId" label="Eternal link" prepend-icon="mdi-link"></v-text-field>
            <span>
              <v-icon>{{ markdown ? 'mdi-language-markdown' : 'mdi-language-html5' }}</v-icon>
              Language
            </span>
            <v-switch color="accent" v-model="markdown" :label="markdown ? 'Markdown' : 'HTML'"></v-switch>
            <v-btn v-if="!markdown && !addPost" color="info" @click="loadContent">Edit raw HTML</v-btn>
            <v-slider
              v-model="postData.secret"
              step="1"
              min="0"
              :max="userData.role + 1"
              show-ticks="always"
              thumb-label
              label="Secret level"
              :prepend-icon="lockIcon"
            ></v-slider>
            <v-row>
              <v-col>
                <span>
                  <v-icon>{{ postData.hidden ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                  Hidden?
                </span>
                <v-switch color="accent" v-model="postData.hidden" :label="postData.hidden ? 'Hidden' : 'Public'"></v-switch>
              </v-col>
              <v-col>
                <span>Comment</span>
                <v-switch color="accent" v-model="postData.enableComment" :label="postData.enableComment ? 'Enabled' : 'Disabled'"></v-switch>
              </v-col>
              <v-col>
                <span>Color of Title</span>
                <v-switch color="accent" v-model="postData.darkTitle" :label="postData.darkTitle ? 'Dark' : 'Light'"></v-switch>
              </v-col>
            </v-row>
            <v-btn v-if="richPostExtensions.length" rounded color="primary" @click="explorerOpen = true">
              +<v-icon>mdi-puzzle</v-icon>Plugins
            </v-btn>
            <v-row>
              <v-select
                label="Image Upload Channel"
                :loading="imageUpload.loading"
                :items="imageUpload.channels"
                v-model="imageUpload.channel"
                prepend-icon="mdi-camera"
                item-title="text"
                item-value="value"
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
              prepend-icon="mdi-label"
              multiple
              chips
              closable-chips
              @update:model-value="changeTags"
            ></v-combobox>
            <v-text-field v-model="postData.img" label="Banner Image" prepend-icon="mdi-image"></v-text-field>
            <v-row>
              <v-col :cols="3">
                <v-select :items="availableEditors" v-model="currentEditor" label="Editor" item-title="text" item-value="value"></v-select>
              </v-col>
              <v-col v-if="currentEditor === 'easymde'">
                <span>Paste Option</span>
                <v-switch color="accent" v-model="pasteHtml" :label="pasteHtml ? 'HTML' : 'Plain Text'"></v-switch>
              </v-col>
            </v-row>
            <span>Content</span>
            <editor-switcher
              v-model="postDataContent"
              :editor="currentEditor"
              :use-markdown="markdown"
              :dark="!currentColorScheme"
              :post-page-action-bus="postPageActionBus"
              :paste-html="pasteHtml"
            />

            <v-card-actions>
              <v-spacer></v-spacer>
              <div v-if="loading">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
              <div v-else>
                <v-btn class="ma-1" v-if="!addPost" color="info" icon="mdi-refresh" @click="reloadPost"></v-btn>
                <v-btn class="ma-1" v-if="!addPost" color="error" icon="mdi-delete" @click="deleteDialog = true"></v-btn>
                <v-btn class="ma-1" color="secondary" icon="mdi-archive" @click="saveDraft" :loading="loading"></v-btn>
                <v-btn
                  class="ma-1"
                  color="primary"
                  :loading="loading"
                  :disabled="!valid"
                  @click="doEditPost"
                >
                  <v-icon>mdi-cloud-upload</v-icon>
                  <span v-if="!isMobile">({{ commandText }}+Shift+S)</span>
                </v-btn>
              </div>
            </v-card-actions>
          </v-form>
        </v-col>
      </v-row>

      <div v-page-title="realTitle"></div>
      <v-dialog v-model="deleteDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h5">Are you sure?</v-card-title>
          <v-card-text>
            You are deleting {{ postData.title }}
            <br />
            This post will be deleted, and can NOT be undone.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="info" variant="text" @click="deleteDialog = false">No</v-btn>
            <v-btn color="error" variant="text" :loading="loading" @click="deletePost">
              Yes, delete<v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <plugin-explorer
        v-model="explorerOpen"
        :plugins="richPostExtensions.map(p => ({ name: p.name, component: p.editPage }))"
      ></plugin-explorer>
    </v-container>
    <toast v-model="toast.show" :text="toast.text" :color="toast.color"></toast>
    <blog-footer></blog-footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import utils from '../common/utils'
import BlogToolbar from './BlogToolbar.vue'
import 'github-markdown-css'
import 'highlight.js/styles/xcode.css'
import { platform } from '../common/platform'
import { mapToCamelCase, mapToUnderline } from '../common/helpers'
import PluginExplorer from './EditPluginExplorer.vue'
import { plugins } from '../plugins/RoseliaPluginHost'
import { pushContext, flushContext } from '../custom-command/luis'
import { getImageChannels, uploadImage } from '../common/api/images'
import UploadedImages from './UploadedImages.vue'
import { markdown } from '../common/roselia-markdown'
import { debounce } from '../common/fake-lodash'
import { EditorSwitcher } from '../common/rich-editor/editor-switcher'

export default defineComponent({
  name: 'post-edit',
  components: { BlogToolbar, PluginExplorer, UploadedImages, EditorSwitcher },
  props: {
    userData: { type: Object as PropType<any>, default: null },
    currentColorScheme: { type: Boolean, default: false }
  },
  emits: ['forceSwitchToLight', 'forceSwitchToDark'],
  data() {
    return {
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
        tags: [] as string[]
      } as any,
      toast: { show: false, text: '', color: '' as any },
      deleteDialog: false,
      valid: true,
      markdown: true,
      addPost: 0 as any,
      loading: false,
      configs: { spellChecker: false, hideIcons: ['guide'] },
      uploadImages: [] as any[],
      doNotSave: false,
      explorerOpen: false,
      imageUpload: {
        channel: 'roselia',
        channels: [] as any[],
        loading: true,
        convertToWebp: false
      },
      pasteHtml: false,
      availableEditors: (EditorSwitcher as any).availableEditors,
      currentEditor: (EditorSwitcher as any).defaultEditor,
      _debouncedSave: null as any
    }
  },
  computed: {
    realTitle(): string {
      return this.addPost ? 'Add a post' : `Edit: ${this.postData.title}`
    },
    operationVerb(): string {
      return this.addPost ? 'add' : 'edit'
    },
    lockIcon(): string {
      return this.postData.secret ? 'mdi-lock' : 'mdi-lock-open'
    },
    isMac(): boolean {
      return platform.macOS
    },
    isMobile(): boolean {
      return platform.mobile
    },
    commandText(): string {
      return this.isMac ? '⌘' : 'Ctrl'
    },
    richPostExtensions(): any[] {
      return (plugins as any).richPostPlugin
    },
    postDataContent: {
      get(): string {
        return this.postData.content
      },
      set(value: string) {
        this.postData.content = value
      }
    },
    postPageActionBus(): any {
      return {
        save: () => this.doEditPost(),
        goToPreview: () => {
          this.$router.push({ name: 'post', params: { data: this.getPreviewData() } } as any)
        },
        goToLivePreview: () => {
          window.open(this.$router.resolve({ name: 'postLivePreview', params: { previewPostId: this.postData.id || 0 } }).href, '_blank')
        },
        uploadImage: async (image: File, origionalUrl: string) => {
          const placeHolder: any = {
            url: origionalUrl,
            channel: this.imageUpload.channel,
            loading: true,
            fileName: 'Uploading...'
          }
          try {
            this.uploadImages = [...this.uploadImages, placeHolder]
            const uploaded: any = await uploadImage(image, this.imageUpload.channel, this.imageUpload.convertToWebp ? 'webp' : undefined)
            if (!uploaded.success) throw new Error(uploaded.msg)
            this.uploadImages = this.uploadImages.map((x: any) => (x === placeHolder ? uploaded.result : x))
            return uploaded.result
          } catch (error) {
            this.showToast(error as any, 'error')
            this.uploadImages = this.uploadImages.filter((x: any) => x !== placeHolder)
          }
        }
      }
    }
  },
  watch: {
    userData(val: any) {
      if (!val) this.makeRedirect({ name: 'login' })
    },
    postDataContent(newValue: string, oldValue: string) {
      if (newValue === oldValue) return
      this._debouncedSave && this._debouncedSave()
    }
  },
  created() {
    this._debouncedSave = debounce(() => this.saveDraft(), 500)
  },
  mounted() {
    if (!this.userData) {
      return this.makeRedirect({
        name: 'login',
        params: { logout: true, message: `Login to ${this.operationVerb} a post` }
      })
    }
    if (!this.userData.role) {
      this.showToast('You are not supposed to do this.')
      utils.redirectTo({ name: 'index' })
      return
    }
    if ((this.$route.params as any).deletePost) {
      this.deleteDialog = true
      this.postData.title = (this.$route.params as any).title
      const unwatch = this.$watch('deleteDialog', () => {
        unwatch()
        this.doNotDelete()
      })
      return
    }
    this.addPost = !this.getPostNum() ? 1 : 0
    const loaded = this.preload()
    if (!loaded && !this.addPost) this.loadContent()

    window.addEventListener('beforeunload', this.saveDraft)
    pushContext({
      'Utilities.FinishTask': this.doEditPost,
      'Utilities.Confirm': this.doEditPost,
      'Utilities.Cancel': this.leave,
      save: this.doEditPost
    }, this)
    getImageChannels().then((channels: any) => {
      this.imageUpload.channels = channels.map((c: any) => ({
        text: `${c.name} - ${c.description}`,
        value: c.id
      }))
      this.imageUpload.loading = false
    })
  },
  beforeUnmount() {
    if (!this.doNotSave) this.saveDraft()
  },
  unmounted() {
    this.$emit('forceSwitchToLight')
    window.removeEventListener('beforeunload', this.saveDraft)
    flushContext()
  },
  methods: {
    showToast(text: any, color: string = 'info') {
      this.toast.text = text
      this.toast.color = color
      this.toast.show = true
    },
    changeToast(show: boolean) { this.toast.show = show },
    makeRedirect(to: any) {
      utils.setRedirect(this.$route.fullPath)
      utils.redirectTo(to)
    },
    changeTags() {
      this.postData.tags = (this.postData.tags || []).map((t: string) => t.replace(/ /g, '-'))
    },
    getPostNum(): any {
      return (this.$route.query as any).post
    },
    getPostData() {
      this.changeTags()
      return {
        markdown: this.markdown,
        data: this.postData,
        uploadImages: this.uploadImages,
        editor: this.currentEditor
      }
    },
    getPostDraft(pid: any) {
      return JSON.parse(window.localStorage.getItem(`postDraft#${pid || 0}`) || 'null')
    },
    saveDraft() {
      window.localStorage.setItem(`postDraft#${this.postData.id || 0}`, JSON.stringify(this.getPostData()))
      this.showToast('Draft saved!')
    },
    deleteDraft() {
      window.localStorage.removeItem(`postDraft#${this.postData.id || 0}`)
    },
    getRequestForm() {
      const data = {
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
    loadDraft(): boolean {
      const pid = this.getPostNum() || 0
      const dft = this.getPostDraft(pid)
      if (dft) {
        this.markdown = dft.markdown
        this.postData = dft.data
        this.uploadImages = dft.uploadImages || []
        this.currentEditor = dft.editor || this.currentEditor
      }
      return !!dft
    },
    preload(): boolean {
      const stat = this.loadDraft()
      stat && this.showToast('Draft loaded!')
      return stat
    },
    loadContent() {
      const postNum = this.getPostNum()
      if (!postNum) return
      this.loading = true
      utils.fetchJSON(utils.apiFor('post', postNum), 'GET', { markdown: this.markdown }).then((data: any) => {
        this.loading = false
        if (!data) {
          this.addPost = 1
          return
        }
        this.postData = mapToCamelCase(data)
      }).catch((reason: any) => this.showToast(reason, 'error'))
    },
    doEditPost(shouldRedirect: boolean = true) {
      if (!this.valid) return
      this.loading = true
      return utils.fetchJSONWithSuccess(utils.apiFor('add'), 'POST', this.getRequestForm()).then(() => {
        this.showToast('Post Saved', 'success')
        if (shouldRedirect || this.addPost) this.leave()
      }).catch((reason: any) => {
        this.$Progress.fail()
        if (reason === 'expired') {
          return utils.refreshToken().then(() => this.doEditPost()).catch(() => {
            this.showToast('Token Expired!', 'warning')
            this.makeRedirect({ name: 'login' })
          })
        } else {
          this.showToast(reason, 'error')
        }
      }).finally(() => {
        this.deleteDialog = false
        this.loading = false
      })
    },
    deletePost() {
      const pid = this.getPostNum()
      if (!pid) return
      const userData = utils.getLoginData()
      if (!(userData && userData.role)) {
        this.showToast('You are not supposed to do this.', 'warning')
        return
      }
      utils.fetchJSONWithSuccess(utils.apiFor('remove'), 'POST', { postID: pid }).then(() => {
        this.showToast('Success!', 'success')
        this.leave(true)
      }).catch((reason: any) => {
        if (reason === 'expired') {
          this.showToast('Token Expired!', 'warning')
          this.$router.push({ name: 'login' })
        } else {
          this.showToast(reason, 'error')
        }
      })
    },
    reloadPost() {
      this.markdown = true
      this.loadContent()
    },
    doNotDelete() {
      this.deleteDialog = false
      this.leave()
    },
    leave(deleteDraft: boolean = true) {
      deleteDraft && this.deleteDraft()
      this.doNotSave = deleteDraft
      if ((this.$route.params as any).deletePost) this.$router.go(-1)
      else utils.redirectTo({ name: 'index' })
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
  }
})
</script>
