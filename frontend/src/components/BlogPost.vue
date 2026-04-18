<template>
  <div id="post">
    <nav-bar :user-data="userData" :route="$route.fullPath"></nav-bar>
    <v-parallax
      v-if="postData.img"
      id="main-pic"
      :src="postData.img || config.images.postBannerImage"
      :class="{
        'blur-image': extraDisplaySettings.blurMainImage,
        'blur-image-transition': true
      }"
    >
      <v-row
        v-if="!extraDisplaySettings.metaBelowImage"
        align="center"
        justify="center"
        :class="titleClass"
      >
        <v-col cols="12" class="text-center">
          <h1 id="title" class="text-h3 font-weight-thin mb-3">{{ postData.title }}</h1>
          <h4 id="subtitle" class="text-subtitle-1">{{ postData.subtitle }}</h4>
          <h4 id="date" class="text-subtitle-1">{{ formatDate(postData.created) || postData.date }}</h4>
          <h4 id="author" class="text-subtitle-2">{{ postData.author.nickname }}</h4>
        </v-col>
      </v-row>
    </v-parallax>
    <v-container v-if="!postData.img || extraDisplaySettings.metaBelowImage">
      <v-row align="center" justify="center">
        <v-col cols="12" class="text-center">
          <h1 id="title" class="text-h3 font-weight-thin mb-3">{{ postData.title }}</h1>
          <h2 id="subtitle" class="text-subtitle-1">{{ postData.subtitle }}</h2>
          <h4 id="date" class="text-subtitle-1">{{ formatDate(postData.created) || postData.date }}</h4>
          <h4 id="author" class="text-subtitle-2">{{ postData.author.nickname }}</h4>
        </v-col>
      </v-row>
    </v-container>
    <v-container fluid class="fill-height">
      <v-row>
        <v-col cols="12" sm="10" offset-sm="2">
          <v-row>
            <router-link
              v-for="tag in postData.tags"
              :to="{ name: 'index', params: { tag }, query: { tag } }"
              :key="tag"
            >
              <v-chip class="ma-1">{{ tag }}</v-chip>
            </router-link>
            <v-chip v-if="postData.secret" class="ma-1" color="success">
              <template #prepend><v-icon>mdi-lock</v-icon></template>
              Secret {{ postData.secret }}
            </v-chip>
            <v-chip v-if="postData.id === -1" class="ma-1" color="warning">
              <template #prepend><v-icon>mdi-alert</v-icon></template>
              404
            </v-chip>
            <v-chip v-if="postData.hidden" class="ma-1" color="grey">
              <template #prepend><v-icon>mdi-eye-off</v-icon></template>
              Hidden
            </v-chip>
          </v-row>
          <v-col cols="12" md="10">
            <v-row>
              <v-btn v-if="cachedData" color="secondary" icon="mdi-arrow-left" size="small" @click="$router.go(-1)"></v-btn>
              <v-spacer></v-spacer>
              <div v-if="postData.id !== 'preview' && postData.id !== -1 && isEditable">
                <v-btn
                  class="ma-2"
                  color="error"
                  size="small"
                  icon="mdi-delete"
                  :to="{ name: 'edit', params: { deletePost: true, title: postData.title }, query: { post: postData.id } }"
                ></v-btn>
                <v-btn
                  class="ma-2"
                  color="primary"
                  size="small"
                  icon="mdi-pencil"
                  :to="{ name: 'edit', query: { post: postData.id } }"
                ></v-btn>
              </div>
              <v-btn
                v-if="isPostFound && !isShared"
                class="ma-2"
                size="small"
                color="secondary"
                icon="mdi-share"
                @click="sharePost"
              ></v-btn>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-alert
                  v-if="postData.id === 'preview' && !postData.serverRendered && postData.markdownContent"
                  border="start"
                  prominent
                  type="info"
                  elevation="2"
                >
                  <v-row align="center">
                    <v-col>
                      This page is rendered by your browser.
                      <v-btn :loading="loading" @click="renderPreviewByServer">Render it via server</v-btn>
                    </v-col>
                  </v-row>
                </v-alert>
              </v-col>
            </v-row>
          </v-col>
          <v-row>
            <v-col :sm="hasDigest ? 8 : 10">
              <div id="content" class="flow-text responsive-img" ref="content">
                <div v-if="rsRendered" ref="rhodonite"></div>
                <div v-else v-html="postData.content"></div>
              </div>
              <div class="flow-text" v-if="postData.id < 0">
                <p>Oops, we can not show you the post.</p>
                <p><strong>This may because:</strong></p>
                <ol>
                  <li>Your post ID is invalid.</li>
                  <li>This post is secret<strong v-if="userData"> and even beyond your permission level</strong>.</li>
                  <li v-if="userData && isTokenExpired" class="text-warning">
                    <v-icon color="warning">mdi-alert</v-icon>Your session is expired.
                  </li>
                  <li>Your network condition is poor.</li>
                </ol>
                <p><strong>All you need to do is check your input, refresh your token or try to login again.</strong></p>
              </div>
            </v-col>
            <v-col v-if="hasDigest" sm="2">
              <blog-digest-nav :items="postDigest"></blog-digest-nav>
            </v-col>
          </v-row>
          <div v-page-title="postData.title"></div>
        </v-col>
      </v-row>
    </v-container>

    <v-container v-if="postData.author" fluid>
      <v-row justify="center">
        <div v-if="postData.author.avatar">
          <v-avatar class="elevation-7">
            <v-img :src="postData.author.avatar" :alt="postData.author.username"></v-img>
          </v-avatar>
        </div>

        <div v-if="postData.author && postData.author.username">
          <router-link :to="{ name: 'userTimeline', params: { username: postData.author.username } }">
            <v-chip>
              @{{ postData.author.username }} ({{ postData.author.nickname }})
            </v-chip>
          </router-link>
        </div>
      </v-row>
    </v-container>

    <v-container>
      <div class="text-center">
        <h4 class="text-subtitle-1 text-grey">
          Last edit at: <relative-date-time :date="postData.lastEdit" :brief="false" />
        </h4>
      </div>
    </v-container>

    <v-container>
      <v-col cols="12" sm="10" offset-sm="1">
        <v-row>
          <v-btn
            v-if="postData.next !== -1"
            color="primary"
            :icon="(!nextMeta || !shouldDisplayAdjacentMeta) ? 'mdi-chevron-left' : undefined"
            :rounded="!!nextMeta"
            :size="!nextMeta || !shouldDisplayAdjacentMeta ? 'small' : undefined"
            :to="{ name: 'post', query: { p: postData.next } }"
          >
            <template v-if="nextMeta && shouldDisplayAdjacentMeta">
              <v-icon>mdi-chevron-left</v-icon>{{ nextMeta.title }}
            </template>
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            v-if="postData.prev !== -1"
            color="primary"
            :icon="(!prevMeta || !shouldDisplayAdjacentMeta) ? 'mdi-chevron-right' : undefined"
            :rounded="!!prevMeta"
            :size="!prevMeta || !shouldDisplayAdjacentMeta ? 'small' : undefined"
            :to="{ name: 'post', query: { p: postData.prev } }"
          >
            <template v-if="prevMeta && shouldDisplayAdjacentMeta">
              {{ prevMeta.title }}<v-icon>mdi-chevron-right</v-icon>
            </template>
          </v-btn>
        </v-row>
      </v-col>
      <blog-comments
        v-if="isPostFound"
        :user-data="userData"
        :post-data="postData"
        :toast="showToast"
        :renderer="renderer"
      ></blog-comments>
    </v-container>

    <toast v-model="toast.show" :color="toast.color" :text="toast.text"></toast>
    <blog-footer></blog-footer>

    <v-dialog v-model="share.open" width="500">
      <v-card>
        <v-card-title class="text-h5 bg-primary">Share {{ postData.title }}</v-card-title>
        <v-card-text>
          <v-text-field label="Address" variant="outlined" :model-value="sharePath" readonly></v-text-field>
          <a :href="sharePath">Shared_{{ postData.title }}</a> &lt;- Right click and copy link.
          <p>This post will be visible regardless of the user privileges.</p>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="accent" variant="text" @click="share.open = false">Done</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { useDisplay, useGoTo, useTheme } from 'vuetify'
import utils from '../common/utils'
import BlogDigestNav from './BlogDigestNav.vue'
import RoseliaScript from '../common/roselia-script/'
import { mapToCamelCase } from '../common/helpers'
import BlogComments from './comments.vue'
import { pushContext, flushContext } from '../custom-command/luis'
import WsBus from '../plugins/ws-bus'
import RelativeDateTime from './RelativeTime'
import meta from '../common/config'
import { getStorageForDraft, importAndRenderMarkdown } from '../common/post-information'

const escapeRegExp = (input: string) => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const extraDisplaySettings = {
  metaBelowImage: false,
  blurMainImage: false,
  disableSideNavigation: false
}

export default defineComponent({
  name: 'blog-post',
  components: {
    BlogDigestNav,
    BlogComments,
    RelativeDateTime
  },
  props: {
    p: { type: Number, default: undefined },
    currentColorScheme: { type: Boolean, default: false },
    userData: { type: Object as PropType<any>, default: null }
  },
  emits: ['postLoaded', 'postUnload', 'postDestroyed'],
  setup() {
    return {
      display: useDisplay(),
      goTo: useGoTo(),
      theme: useTheme(),
      config: meta
    }
  },
  data() {
    return {
      postData: {
        img: '',
        id: 0,
        displayId: '',
        content: '<p>Loading, please wait...</p>',
        author: { nickname: '' } as any,
        darkTitle: false,
        next: -1,
        prev: -1,
        secret: 0,
        title: 'Loading...',
        subtitle: '',
        tags: [''],
        date: new Date().toDateString(),
        lastEdit: new Date()
      } as any,
      postDigest: [] as any[],
      cachedData: false,
      toast: utils.getToastOption(),
      rsRendered: false,
      share: { open: false, shareId: '' },
      extraDisplaySettings: { ...extraDisplaySettings },
      loading: false,
      nextMeta: null as any,
      prevMeta: null as any,
      renderer: null as any,
      busUnsubscribe: null as null | (() => void)
    }
  },
  computed: {
    hasDigest(): boolean {
      return !this.extraDisplaySettings.disableSideNavigation &&
        this.display.smAndUp.value &&
        this.postDigest.length > 0
    },
    isTokenExpired(): boolean {
      return utils.isTokenExpired(this.userData && this.userData.token)
    },
    titleClass(): string {
      return this.postData.darkTitle ? 'text-black' : 'text-white'
    },
    isEditable(): boolean {
      if (!this.postData.author || !this.userData) return false
      return this.userData.role >= this.postData.author.role
    },
    isPostFound(): boolean {
      return this.postData.id > 0
    },
    isShared(): boolean {
      return !!(this.$route.params as any).shareId
    },
    sharePath(): string {
      if (!this.postData.secret || !this.share.shareId) return location.href
      const path = this.$router.resolve({
        name: 'sharedPost',
        params: { shareId: this.share.shareId }
      }).href
      const a = document.createElement('a')
      a.href = path
      return a.href
    },
    shouldDisplayAdjacentMeta(): boolean {
      return this.display.mdAndUp.value
    }
  },
  watch: {
    userData() {
      if (!this.userData && this.postData.secret) {
        this.postData = this.notFoundData()
      }
      this.postData.id === -1 && this.loadContent()
    }
  },
  mounted() {
    this.renderer = RoseliaScript.createRenderer(this)
    const params = this.$route.params as any
    if (params.shareId) this.getPostByShared(params.shareId)
    else if (params.previewPostId) this.setUpLivePreview(params.previewPostId)
    else this.loadContent()
    if (!(window as any).MathJax) {
      const mathNode = document.createElement('script')
      mathNode.async = true
      mathNode.src = 'https://cdn.bootcss.com/mathjax/2.7.3/latest.js?config=TeX-MML-AM_CHTML'
      const configNode = document.createElement('script')
      configNode.type = 'text/x-mathjax-config'
      configNode.innerHTML = `MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\\\(','\\\\)']]}});`
      document.body.appendChild(configNode)
      document.body.appendChild(mathNode)
    }
    const shiftPage = (p: number) => {
      if (p !== -1) this.$router.push({ name: 'post', query: { p } })
    }
    pushContext({
      'Utilities.ShowNext': () => shiftPage(this.postData.prev),
      'Utilities.ShowPrevious': () => shiftPage(this.postData.next),
      edit: () => this.$router.push({ name: 'edit', query: { post: this.postData.id } }),
      delete: () => this.$router.push({ name: 'edit', params: { deletePost: true, title: this.postData.title }, query: { post: this.postData.id } })
    }, this)
    if (WsBus.globalBus) {
      this.busUnsubscribe = WsBus.globalBus.addEventListener('post_edited', ({ id }: any) => {
        if (id == this.postData.id) this.loadContent()
      })
    }
  },
  unmounted() {
    this.$emit('postUnload')
    this.$emit('postDestroyed')
    flushContext()
    this.renderer && this.renderer.destroy()
    this.busUnsubscribe && this.busUnsubscribe()
  },
  beforeRouteUpdate(to, from, next) {
    if ((to.params as any).doNotLoad) return next()
    const toLink = this.resolvePostLink((to.params as any).postLink)
    const fromLink = this.resolvePostLink((from.params as any).postLink)
    if (to.query.p === from.query.p && toLink == fromLink) return next()
    this.goTo(0)
    this.$emit('postUnload')
    this.loadContent(to.query.p as any, to)
    next()
  },
  methods: {
    showToast(text: string, color?: string) {
      return utils.showToast.call(this, text, color)
    },
    getArguments() {
      return this.$route.query as any
    },
    formatDate(date: any, withTime = false) {
      return utils.formatDate(date, withTime)
    },
    loadContent(p?: any, context?: any) {
      this.$emit('postUnload')
      this.$emit('postDestroyed')
      p = p || this.getPostNum()
      context = context || this.$route
      if (context && context.params && context.params.data) {
        const data = context.params.data
        if (data.id === 'preview' || data.id == p) {
          this.postData = { ...this.notFoundData(), ...data }
          this.cachedData = true
          this.processContent()
          return
        }
      }
      const useLink = context.name !== 'post'
      if (useLink) p = this.resolvePostLink(context.params.postLink)
      this.cachedData = false
      if (p === -1) {
        this.postData = this.notFoundData()
        return
      }
      this.loading = true
      utils.fetchJSON(utils.apiFor(useLink ? 'post-link' : 'post', p)).then((data: any) => {
        this.loading = false
        if (!data) return Promise.reject(ReferenceError('NPE'))
        this.postData = mapToCamelCase(data)
        return this.processContent()
      }).catch(() => {
        this.loading = false
        this.postData = this.notFoundData()
      })
    },
    processContent() {
      this.resetExtraDisplaySettings()
      const params = this.$route.params as any
      if (this.postData.displayId && (params.changeRoute || (this.$route.query.p && !this.isShared))) {
        this.$router.replace({
          name: 'postWithEternalLink',
          params: { postLink: this.postData.displayId.split('/'), doNotLoad: true }
        } as any)
      }
      Object.defineProperty(this.postData, 'id', {
        value: this.postData.id,
        writable: false
      })
      if (!this.postData.rawContent) {
        const [firstLine, ...lines] = this.postData.content.split('\n')
        const inDomMode = firstLine.includes('---feature:roselia-dom')
        this.postData.inDomMode = inDomMode
        if (inDomMode) this.postData.rawContent = lines.join('\n')
        else this.postData.rawContent = this.postData.content
        if (inDomMode) this.renderer.setDomUpdateCallback(this.afterContentMounted)
        else this.renderer.setRenderUpdateCallback(this.processContent)
      }

      this.renderer.resetMounted()
      const popContext = this.renderer.pushContext(this.postData, 'post')

      if (this.postData.inDomMode) {
        this.rsRendered = true
        this.postData.content = ''
        this.$nextTick(() => {
          this.renderer.mount(this.postData.rawContent, this.$refs.rhodonite as Element)
        })
      } else {
        this.rsRendered = false
        this.renderer.renderAsync(this.postData.rawContent || this.postData.content).then((template: string) => {
          this.postData.content = template
          this.$nextTick(() => {
            this.renderer.injectEvents()
            popContext()
          })
        }).then(() => this.$nextTick(async () => this.afterContentMounted()))
      }
      this.getAdjacentPostMeta()
    },
    afterContentMounted() {
      const contentEl = this.$refs.content as Element
      if (!contentEl) return
      const postImages = contentEl.querySelectorAll('img')
      Array.from(postImages).forEach(e => e.classList.add('responsive-img'))
      this.setDigest()
      const escapedHost = escapeRegExp(location.host)
      const patterns = [`${escapedHost}/.*\\?p=(\\d+)`, `${escapedHost}(?:/.*)?/post/([\\s\\S]*)`].map(s => new RegExp(s))
      const links = Array.from(contentEl.querySelectorAll('a')).filter(e => !!e.href)
      links.filter(e => e.host === location.host).forEach(ev => {
        const link = ev.href
        const pidMatchResult = patterns[0].exec(link)
        const displayIdMatchResult = patterns[1].exec(link)
        if (pidMatchResult || displayIdMatchResult || ev.pathname === location.pathname) {
          const p = (pidMatchResult || displayIdMatchResult || ['', 'preview'])[1]
          const isFootNotes = ev.hash

          ev.addEventListener('click', e => {
            e.preventDefault()
            if (isFootNotes) {
              this.goTo(document.getElementById(ev.hash.substring(1)) as any, { offset: 200 })
              return
            }
            this.$router.push({
              name: pidMatchResult ? 'post' : 'postWithEternalLink',
              query: { p: pidMatchResult ? p : undefined },
              params: {
                postLink: displayIdMatchResult ? p : undefined
              }
            } as any)
          }, true)
        }
      })
      this.highlightLanguage()
      this.renderWithMathJax()
      this.$emit('postLoaded')

      if (this.postData.img) {
        const postId = this.postData.id
        const dom = document.createElement('img')
        dom.addEventListener('error', () => {
          if (postId === this.postData.id) this.postData.img = ''
        })
        dom.src = this.postData.img
      }
    },
    highlightLanguage() {
      const hljs = (window as any).hljs
      if (hljs) {
        hljs.initHighlighting && (hljs.initHighlighting.called = false)
        hljs.initHighlighting && hljs.initHighlighting()
      }
    },
    renderWithMathJax() {
      const MathJax = (window as any).MathJax
      if (MathJax) MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'output'])
    },
    getPostNum(): any {
      return (this.getArguments() as any).p || -1
    },
    notFoundData() {
      return {
        img: '', id: -1, content: '', next: -1, prev: -1, secret: 0,
        title: 'Page Not Found',
        subtitle: 'Please check your post-id. Or try to login.',
        author: { nickname: '' }, darkTitle: false, tags: [],
        created: new Date(), lastEdit: new Date()
      }
    },
    setDigest() {
      const contentEl = this.$refs.content as Element
      if (!contentEl) return
      this.postDigest = Array.from(contentEl.querySelectorAll('h1,h2,h3')).map((e, idx) => {
        e.classList.add('section')
        e.id = e.id || `section-${idx}`
        return { hash: e.id, title: (e as HTMLElement).innerText, element: e }
      })
    },
    getPostByShared(sid: string) {
      utils.fetchJSON(utils.apiFor('post', 'get-shared', sid)).then((data: any) => {
        if (!data) return Promise.reject('')
        this.postData = { ...this.notFoundData(), ...mapToCamelCase(data) }
        this.processContent()
      }).catch(() => {
        this.postData = this.notFoundData()
      })
    },
    sharePost() {
      this.share.shareId = ''
      if (this.postData.secret) {
        utils.fetchJSONWithSuccess(utils.apiFor('post', 'share'), 'post', { pid: this.postData.id })
          .then((sid: string) => { this.share.shareId = sid })
      }
      this.share.open = true
    },
    async renderPreviewByServer() {
      if (this.postData.id !== 'preview' || !this.postData.markdownContent) return
      this.loading = true
      try {
        const data = await utils.fetchJSONWithSuccess(utils.apiFor('post', 'render-markdown'), 'POST', {
          markdown: this.postData.markdownContent
        })
        this.$emit('postUnload')
        this.$emit('postDestroyed')
        this.postData.content = data
        this.postData.serverRendered = true
        this.processContent()
      } finally {
        this.loading = false
      }
    },
    getAdjacentPostMeta() {
      if (!this.prevMeta || this.prevMeta.id !== this.postData.prev) {
        this.prevMeta = null
        if (this.postData.prev > 0) {
          utils.fetchJSONWithSuccess(utils.apiFor('post', 'meta', 'id', this.postData.prev))
            .then((data: any) => { this.prevMeta = data })
        }
      }
      if (!this.nextMeta || this.nextMeta.id !== this.postData.next) {
        this.nextMeta = null
        if (this.postData.next > 0) {
          utils.fetchJSONWithSuccess(utils.apiFor('post', 'meta', 'id', this.postData.next))
            .then((data: any) => { this.nextMeta = data })
        }
      }
    },
    resetExtraDisplaySettings() {
      this.extraDisplaySettings = { ...extraDisplaySettings }
    },
    resolvePostLink(link: any) {
      if (Array.isArray(link)) return link.join('/')
      return link
    },
    setUpLivePreview(postId: any) {
      const storage = getStorageForDraft(postId)
      storage.addChangeListener(async (draft: any) => {
        if (!draft) {
          this.postData = {
            ...this.notFoundData(),
            title: 'This Post is Not Ready',
            content: 'Please just write something and save draft.',
            subtitle: 'Please make sure such draft exists.'
          }
          return
        }
        const content = draft.markdown ? (await importAndRenderMarkdown(draft.data.content)) : draft.data.content
        this.$emit('postUnload')
        this.postData = {
          ...this.notFoundData(),
          ...draft.data,
          id: 'preview',
          content,
          markdownContent: draft.markdown ? draft.data.content : undefined,
          prev: -1,
          next: -1
        }
        this.processContent()
      }, true)
    }
  }
})
</script>

<style>
.blur-image:not(:hover) .v-parallax__image-container {
  filter: blur(10px) saturate(120%);
}
.blur-image-transition .v-parallax__image-container {
  transition: 0.5s filter cubic-bezier(0.075, 0.82, 0.165, 1);
}
</style>
