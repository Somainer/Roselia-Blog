<template>
  <div id="post">
    <nav-bar :userData="userData" :route="$route.fullPath"></nav-bar>
    <v-parallax
      id="main-pic"
      dark
      :src="postData.img || config.images.postBannerImage"
      v-if="postData.img"
      :class="{
        'blur-image': extraDisplaySettings.blurMainImage,
        'blur-image-transition': true
      }"
        
    >
      <v-row
        align="center"
        column
        justify="center"
        :class="titleClass"
        v-if="!extraDisplaySettings.metaBelowImage"
      >
        <v-col cols="12" class="text-center">
          <h1 id="title" class="display-2 font-weight-thin mb-3">{{postData.title}}</h1>
          <h4 id="subtitle" class="subtitle-1">{{postData.subtitle}}</h4>
          <h4 id="date" class="subtitle-1">{{formatDate(postData.created) || postData.date}}</h4>
          <h4 id="author" class="subtitle-2">{{postData.author.nickname}}</h4>
        </v-col>
      </v-row>
    </v-parallax>
    <v-container
        v-if="!postData.img || extraDisplaySettings.metaBelowImage"
    >
      <v-row
        align="center"
        column
        justify="center"
      >
        <v-col cols="12" class="text-center">
          <h1 id="title" class="display-3 font-weight-thin mb-3">{{postData.title}}</h1>
          <h2 id="subtitle" class="subtitle-1">{{postData.subtitle}}</h2>
          <h4 id="date" class="subtitle-1">{{formatDate(postData.created) || postData.date}}</h4>
          <h4 id="author" class="subtitle-2">{{postData.author.nickname}}</h4>
        </v-col>
      </v-row>
      
    </v-container>
    <v-container grid-list-md fluid class="fill-height">
      <v-row>
        <v-col wrap cols="12" sm="10" offset-sm="2">
          <v-row>
            <router-link v-for="tag in postData.tags" :to="{name: 'index', params: {tag: tag}, query: {tag: tag}}" :key="tag">
              <v-chip class="ma-1">{{tag}}</v-chip>
            </router-link>
            <v-chip class="ma-1" v-if="postData.secret" color="success" text-color="white">
              <v-avatar left class="success">
                <v-icon>lock</v-icon>
              </v-avatar>
              Secret {{postData.secret}}
            </v-chip>
            <v-chip class="ma-1" v-if="postData.id === -1" color="warning" text-color="white">
              <v-avatar left>
                <v-icon>error</v-icon>
              </v-avatar>
              404
            </v-chip>
            <v-chip class="ma-1" v-if="postData.hidden" color="grey" text-color="white">
              <v-avatar left>
                <v-icon>visibility_off</v-icon>
              </v-avatar>
              Hidden
            </v-chip>
            
          </v-row>
          <v-col cols="12" md="10">
            <v-row>
              <v-btn v-if="cachedData" color="secondary" fab small @click="$router.go(-1)">
                <v-icon>arrow_back</v-icon>
              </v-btn>
              <v-spacer></v-spacer>
              <div v-if="postData.id !== 'preview' && postData.id !== -1 && isEditable">
                <v-btn class="ma-2" color="error" fab small :to="{name: 'edit', params: {deletePost: true, title: postData.title}, query: {post: postData.id}}">
                  <v-icon>delete</v-icon>
                </v-btn>
                <v-btn class="ma-2" color="primary" fab small :to="{name: 'edit', query: {post: postData.id}}">
                  <v-icon>mode_edit</v-icon>
                </v-btn>
              </div>
              <v-btn class="ma-2" fab small color="secondary" @click="sharePost" v-if="isPostFound && !isShared">
                <v-icon>share</v-icon>
              </v-btn>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-alert
                        v-if="postData.id === 'preview' && !postData.serverRendered && postData.markdownContent"
                        border="left"
                        prominent
                        colored-border
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
                  <li v-if="userData && isTokenExpired" class="warning--text"><v-icon color="warning">warning</v-icon>Your session is expired.</li>
                  <li>Your network condition is poor.</li>
                </ol>
                <p><strong>All you need to do is check your input, refresh your token or try to login again.</strong></p>
              </div>
            </v-col>
            <v-col v-if="hasDigest" sm="2">
              <blog-digest-nav :items="postDigest" offset="500" threshold="500"></blog-digest-nav>
            </v-col>

          </v-row>

          <div v-wechat-title="postData.title"></div>
        </v-col>

      </v-row>

    </v-container>
    <v-container v-if="postData.author" fluid>
      <v-row justify="center">
        <div v-if="postData.author.avatar">
          <v-avatar class="elevation-7">
            <v-img
              :src="postData.author.avatar"
              :alt="postData.author.username"
            ></v-img>
          </v-avatar>
        </div>
        
        <div v-if="postData.author && postData.author.username">
          <router-link :to="{name: 'userTimeline', params: {username: postData.author.username}}">
            <v-chip>
              @{{ postData.author.username }} ({{ postData.author.nickname }})
            </v-chip>
          </router-link>
        </div>
      </v-row>
      
    </v-container>
    <v-container>
      <div class="text-center">
        <!-- {{formatDate(postData.lastEdit, true)}} -->
        <h4 class="subtitle-1 grey--text">Last edit at: <relative-date-time :date="postData.lastEdit" :brief="false" /></h4>
      </div>
    </v-container>
    <v-container>
      <v-col cols="12" sm="10" offset-sm="1">
        <v-row>
          <v-btn
                  color="primary"
                  :fab="!nextMeta || !shouldDisplayAdjacentMeta"
                  :rounded="!!nextMeta"
                  :small="!nextMeta || !shouldDisplayAdjacentMeta"
                  v-if="postData.next !== -1"
                  :to="{name: 'post', query: {p: postData.next}}"
          >
            <v-icon>chevron_left</v-icon>{{ (shouldDisplayAdjacentMeta && nextMeta) ? nextMeta.title : '' }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
                  color="primary"
                  :fab="!prevMeta || !shouldDisplayAdjacentMeta"
                  :rounded="!!prevMeta"
                  :small="!prevMeta || !shouldDisplayAdjacentMeta"
                  v-if="postData.prev !== -1"
                  :to="{name: 'post', query: {p: postData.prev}}"
          >
            {{ (shouldDisplayAdjacentMeta && prevMeta) ? prevMeta.title : '' }}<v-icon>chevron_right</v-icon>
          </v-btn>
        </v-row>
      </v-col>
      <blog-comments v-if="isPostFound" :userData="userData" :postData="postData" :toast="showToast" :renderer="renderer"></blog-comments>
    </v-container>
    <v-slide-x-transition>
      <v-menu
              v-model="preview.show"
              offset-y
              :position-x="preview.x"
              :position-y="preview.y"
      >
        <v-card
                :color="preview.color"
                dark
                width="300"
        >
          <v-img v-if="preview.img" :src="preview.img"/>
          <v-card-text>
            <div v-if="!preview.loading">
              <h1 class="title">
                <strong>{{preview.title}}</strong>
              </h1>
              <v-spacer></v-spacer>
              <h6 class="subtitle-1 text-truncate">{{preview.subtitle}}</h6>
            </div>

            <v-progress-linear
                    indeterminate
                    color="white"
                    class="mb-0"
                    v-if="preview.loading"
            ></v-progress-linear>
          </v-card-text>
        </v-card>
      </v-menu>
    </v-slide-x-transition>

    <toast v-model="toast.show" :color="toast.color" :text="toast.text" @showChange="changeToast"></toast>
    <blog-footer></blog-footer>
    <GlobalEvents @mousemove="mouseMoveHandler"></GlobalEvents>
    <v-dialog
      v-model="share.open"
      width="500"
    >
      <v-card>
        <v-card-title
          class="headline primary"
          primary-title
        >
          Share {{ postData.title }}
        </v-card-title>

        <v-card-text>
          <v-text-field
            label="Address"
            outlined
            :value="sharePath"
            readonly
          ></v-text-field>
          <a :href="sharePath">Shared_{{ postData.title }}</a> &lt;- Right click and copy link.
          <p>This post will be visible regardless of the user privileges.</p>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="accent"
            text
            @click="share.open = false"
          >
            Done
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>
<script>
import utils from '../common/utils'
import BlogDigestNav from './BlogDigestNav'
import M from 'materialize-css'
import RoseliaScript from '../common/roselia-script/'
import {mapToCamelCase} from '../common/helpers'
import BlogComments from './comments'
import {escapeRegExp} from 'lodash'
import {pushContext, flushContext} from '../custom-command/luis'
import GlobalEvents from 'vue-global-events'
import WsBus from '../plugins/ws-bus'
import RelativeDateTime from './RelativeTime'
import { getStorageForDraft, importAndRenderMarkdown } from '../common/post-information'

const extraDisplaySettings = {
  metaBelowImage: false,
  blurMainImage: false,
  disableSideNavigation: false
};

export default {
  components: {
    BlogDigestNav,
    BlogComments,
    GlobalEvents,
    RelativeDateTime
  },
  name: 'blog-post',
  props: {
    p: Number,
    currentColorScheme: Boolean,
    userData: Object
  },
  data: () => ({
    postData: {
      img: '',
      id: 0,
      displayId: '',
      content: '<p>Loading, please wait...</p>',
      author: {
        nickname: ''
      },
      darkTitle: false,
      next: -1,
      prev: -1,
      secret: 0,
      title: 'Loading...',
      subtitle: '',
      tags: [''],
      date: (new Date()).toDateString(),
      lastEdit: new Date
    },
    postDigest: [],
    preview: {
      show: false,
      loading: false,
      current: 0,
      title: "",
      subtitle: "",
      attach: "",
      origin: "center center",
      img: "",
      cacheData: null,
      color: 'secondary',
      x: 0,
      y: 0
    },
    cachedData: false,
    /** To make this property non-reactive. */
    // renderer: null,
    toast: utils.getToastOption(),
    rsRendered: false,
    share: {
      open: false,
      shareId: ''
    },
    extraDisplaySettings: {
      ...extraDisplaySettings
    },
    loading: false,
    nextMeta: null,
    prevMeta: null
  }),
  methods: {
    showToast(text, color) {
      return utils.showToast.call(this, text, color)
    },
    changeToast (show) {
      this.toast.show = show
    },
    getArguments() {
      return this.$route.query
    },
    formatDate(date, withTime=false) {
      return utils.formatDate(date, withTime)
    },
    loadContent (p, context) {
      this.$emit('postUnload')
      this.$emit('postDestroyed')
      p = p || this.getPostNum()
      context = context || this.$route
      if (context && context.params.data) {
        let data = context.params.data;
        
        if (data.id === 'preview' || data.id == p) { // By design here.
          this.postData = {...this.notFoundData(), ...data}
          this.cachedData = true
          this.processContent()
          return
        }
      }
      const useLink = context.name !== 'post';  // context && context.params.postLink
      if (useLink) {
        p = this.resolvePostLink(context.params.postLink)
      }
      this.cachedData = false
      if (p === -1) {
        this.postData = this.notFoundData()
        return
      }
      this.loading = true;
      utils.fetchJSON(utils.apiFor(useLink ? 'post-link' : 'post', p)).then(data => {
        this.loading = false
        if (!data) return Promise.reject(ReferenceError('NPE'))
        this.postData = mapToCamelCase(data)
        return this.processContent()
      }).catch(_ => {
        this.loading = false
        this.postData = this.notFoundData()
      })
    },
    processContent () {
      // this.postData.content = this.renderer.render(this.postData.content)
      // this.$nextTick(_ => {
      //   this.afterContentMounted()
      // })
      this.resetExtraDisplaySettings();
      if(this.postData.displayId && (this.$route.params.changeRoute || (this.$route.query.p && !this.isShared))) {
        this.$router.replace({
          name: 'postWithEternalLink',
          params: {
            postLink: this.postData.displayId.split('/'),
            doNotLoad: true
          }
        })
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
        else this.postData.rawContent = this.postData.content;
        if (inDomMode) {
          this.renderer.setDomUpdateCallback(this.afterContentMounted)
        }
        else this.renderer.setRenderUpdateCallback(this.processContent)
      }

      this.renderer.resetMounted()
      const popContext = this.renderer.pushContext(this.postData, 'post')
      
      if (this.postData.inDomMode) {
        this.rsRendered = true
        this.postData.content = '';
        this.$nextTick(() => {
          this.renderer.mount(this.postData.rawContent, this.$refs.rhodonite)
        });
      } else {
        this.rsRendered = false;
        this.renderer.renderAsync(this.postData.rawContent || this.postData.content).then(template => {
          this.postData.content = template
          this.$nextTick(() => {
            this.renderer.injectEvents()
            popContext()
          })
        }).then(() => this.$nextTick(async () => this.afterContentMounted()))
      }
      this.getAdjacentPostMeta()
      // this.rsRendered = false
      // this.renderer.renderVueAsync(this.postData.content).then(v => {
        
      //   this.rsRendered = true
      //   this.$nextTick(() => {
      //     // const div = document.createElement('div')
      //     v.$mount("#rhodonite")
      //     // this.$refs.rhodonite.appendChild(div)
      //     this.$nextTick(() => this.renderer.injectEvents())
      //   })
      //   this.$once('postUnload', () => v.$destroy())
      //   return v
      // }).then(v => {
      //   v.$nextTick(_ => {
      //     this.afterContentMounted()
      //   })
      // })
    },
    afterContentMounted() {
      // utils.setHeimu()
      // utils.colorUtils.apply({selector: '#main-pic img', text: '#title,#subtitle,#date,.digest-nav-el,#digest-nav', changeText: true})
      const postImages = this.$refs.content.querySelectorAll('img')
      Array.from(postImages).forEach(e => {
        e.classList.add('responsive-img')
      })
      M.Materialbox.init(postImages)
      this.setDigest()
      const escapedHost = escapeRegExp(location.host)
      let patterns = [`${escapedHost}/.*\\?p=(\\d+)`, `${escapedHost}(?:/.*)?/post/([\\s\\S]*)`].map(s => new RegExp(s));
      const links = Array.from(this.$refs.content.querySelectorAll('a')).filter(e => !!e.href);
      links.filter(e => e.host === location.host).forEach(async ev => {
        let link = ev.href;
        const pidMatchResult = patterns[0].exec(link)
        const displayIdMatchResult = patterns[1].exec(link)
        if (pidMatchResult || displayIdMatchResult || ev.pathname === location.pathname) {
          let p = (pidMatchResult || displayIdMatchResult || ['', 'preview'])[1];
          const isFootNotes = ev.hash; // && p === this.getPostNum()
          
          ev.addEventListener('click', e => {
            e.preventDefault();
            if(isFootNotes) {
              this.$vuetify.goTo(document.getElementById(ev.hash.substring(1)), {offset: 200})
              return
            }
            // e.stopImmediatePropagation()
            // console.log(this.preview);
            // console.log('data->', this.preview.current == p && !this.preview.loading && this.preview.cacheData || undefined)
            
            this.$router.push({
              name: pidMatchResult ? 'post' : 'postWithEternalLink',
              query: {
                p: pidMatchResult ? p : undefined
              },
              params: {
                data: (this.preview.current == p && !this.preview.loading) ? this.preview.cacheData : undefined,
                postLink: displayIdMatchResult ? p : undefined,
                // postCached: this.preview.current == p && !this.preview.loading
              }
            })
            
          }, true)

          ev.addEventListener('mouseover', async e => {
            // this.preview.origin = `${ev.offsetHeight} ${ev.offsetTop}`
            this.preview.show = true;
            this.preview.attach = ev
            if (isFootNotes) {
              this.preview.cacheData = null
              this.preview.current = p
              let dom = document.getElementById(ev.hash.substring(1))
              this.preview.title = dom.innerText
              this.preview.img = ''
              if(ev.hash.indexOf('ref') !== -1) this.preview.subtitle = dom.parentElement.innerText
              else this.preview.subtitle = ''
              return
            }
            if (this.preview.current === p && !this.preview.loading && this.preview.cacheData) {
              this.preview.current = p;
              // this.preview.loading = true
              // console.log(this.preview)
              return
            }
            this.preview.current = p;
            this.preview.loading = true
            this.preview.img = ''
            utils.fetchJSON(utils.apiFor(pidMatchResult ? 'post' : 'post-link', p)).then(data => {
              if(!data){
                // this.preview.show = false
                this.preview.loading = false
                this.preview.title = 'Oops! :('
                this.preview.subtitle = 'This is a secret'
                this.preview.img = ''
                return
              }
              this.preview.cacheData = mapToCamelCase(data)
              this.preview.loading = false
              this.preview.title = data.title
              this.preview.subtitle = data.subtitle
              this.preview.img = data.img
            }).catch(reason => {
              this.preview.loading = false
              this.preview.cacheData = null
              this.preview.title = ':('
              this.preview.subtitle = reason.message
              this.preview.img = ''
            })
          });
          ev.addEventListener('mouseout', e => {
            this.preview.show = false;
          })
        }
        
        
      });
      this.highlightLanguage()
      this.renderWithMathJax()
      this.$emit('postLoaded')

      if(this.postData.img) {
        const postId = this.postData.id
        const dom = document.createElement('img')
        dom.addEventListener('error', ev => {
          if(postId === this.postData.id) this.postData.img = ''
        })
        dom.src = this.postData.img
      }
    },
    highlightLanguage () {
      if (window.hljs) {
        window.hljs.initHighlighting.called = false
        window.hljs.initHighlighting()
      }
    },
    renderWithMathJax () {
      if(window.MathJax) window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, "output"]);
    },
    getPostNum () {
      return this.getArguments().p || -1
    },
    notFoundData () {
      return {
        img: '',
        id: -1,
        content: ``,
        next: -1,
        prev: -1,
        secret: 0,
        title: 'Page Not Found',
        subtitle: 'Please check your post-id. Or try to login.',
        author: {
          nickname: ''
        },
        darkTitle: false,
        tags: [],
        created: new Date,
        lastEdit: new Date
      }
    },
    setDigest () {
      this.postDigest = Array.from(this.$refs.content.querySelectorAll('h1,h2,h3')).map((e, idx) => {
        e.classList.add('scrollspy')
        e.classList.add('section')
        e.id = e.id || `section-${idx}`
        return {
          hash: e.id,
          title: e.innerText,
          element: e
        }
      })
    },
    getPostByShared(sid) {
      utils.fetchJSON(utils.apiFor('post', 'get-shared', sid)).then(data => {
        if (!data) return Promise.reject('')
        this.postData = {...this.notFoundData(), ...mapToCamelCase(data)}
        this.processContent()
      }).catch(_ => {
        this.postData = this.notFoundData()
      })
    },
    sharePost() {
      this.share.shareId = ''
      if (this.postData.secret) {
        utils.fetchJSONWithSuccess(utils.apiFor('post', 'share'), 'post', {
          pid: this.postData.id
        }).then(sid => {
          this.share.shareId = sid
        })
      }
      this.share.open = true
    },
    mouseMoveHandler (ev) {
      if (!this.preview.show) return;
      this.preview.x = ev.clientX + 10
      this.preview.y = ev.clientY + 10
    },
    async renderPreviewByServer() {
      if (this.postData.id !== 'preview' || !this.postData.markdownContent) return;
      this.loading = true;
      try {
        const data = await utils.fetchJSONWithSuccess(utils.apiFor('post', 'render-markdown'), 'POST', {
          markdown: this.postData.markdownContent
        })
        this.$emit('postUnload')
        this.$emit('postDestroyed')
        this.postData.content = data;
        this.postData.serverRendered = true;
        this.processContent()
      } finally {
        this.loading = false;
      }
    },
    getAdjacentPostMeta() {
      if (!this.prevMeta || this.prevMeta.id !== this.postData.prev) {
        this.prevMeta = null
        if (this.postData.prev > 0) {
          utils.fetchJSONWithSuccess(utils.apiFor('post', 'meta', 'id', this.postData.prev)).then(data => {
            this.prevMeta = data
          })
        }
      }
      if (!this.nextMeta || this.nextMeta.id !== this.postData.next) {
        this.nextMeta = null
        if(this.postData.next > 0) {
          utils.fetchJSONWithSuccess(utils.apiFor('post', 'meta', 'id', this.postData.next)).then(data => {
            this.nextMeta = data
          })
        }
      }
    },
    resetExtraDisplaySettings() {
      this.extraDisplaySettings = {...extraDisplaySettings}
    },
    resolvePostLink(link) {
      if (Array.isArray(link)) return link.join('/')
      else return link
    },
    setUpLivePreview(postId) {
      const storage = getStorageForDraft(postId)
      storage.addChangeListener(async draft => {
        if (!draft) {
          this.postData = {
            ...this.notFoundData(),
            title: `This Post is Not Ready`,
            content: 'Please just write something and save draft.',
            subtitle: 'Please make sure such draft exists.'
          }
          return;
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
  },
  computed: {
    hasDigest () {
      return !this.extraDisplaySettings.disableSideNavigation &&
              this.$vuetify.breakpoint.smAndUp &&
              this.postDigest.length > 0;
    },
    isTokenExpired () {
      return utils.isTokenExpired(this.userData && this.userData.token)
    },
    titleClass () {
      return `${['white', 'black'][+this.postData.darkTitle]}--text`
    },
    isEditable() {
      if (!this.postData.author || !this.userData) return false
      return this.userData.role >= this.postData.author.role
    },
    isPostFound() {
      return this.postData.id > 0
    },
    isShared() {
      return !!this.$route.params.shareId
    },
    sharePath() {
      if (!this.postData.secret || !this.share.shareId) return location.href
      const path = this.$router.resolve({
        name: 'sharedPost',
        params: {
          shareId: this.share.shareId
        }
      }).href
      const a = document.createElement('a')
      a.href = path
      return a.href
    },
    shouldDisplayAdjacentMeta() {
      return this.$vuetify.breakpoint.mdAndUp
    }
  },
  mounted () {
    this.renderer = RoseliaScript.createRenderer(this)
    if(this.$route.params.shareId) this.getPostByShared(this.$route.params.shareId)
    else if (this.$route.params.previewPostId) this.setUpLivePreview(this.$route.params.previewPostId)
    else this.loadContent()
    // console.log(RoseliaScript)
    // this.renderer = RoseliaScript.createRenderer(this)
    if (!window.MathJax) {
      let mathNode = document.createElement('script')
      mathNode.async = true
      mathNode.src = 'https://cdn.bootcss.com/mathjax/2.7.3/latest.js?config=TeX-MML-AM_CHTML'
      let configNode = document.createElement('script')
      configNode.type = 'text/x-mathjax-config'
      configNode.innerHTML = `MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\\\(','\\\\)']]}});`
      document.body.appendChild(configNode)
      document.body.appendChild(mathNode)
    }
    const shiftPage = p => {
      if(p !== -1) this.$router.push({name: 'post', query: {p}})
    }
    pushContext({
      "Utilities.ShowNext"() {
        shiftPage(this.postData.prev) // Goes right
      },
      "Utilities.ShowPrevious"() {
        shiftPage(this.postData.next) // Goes left
      },
      edit() {
        this.$router.push({name: 'edit', query: {post: this.postData.id}})
      },
      delete() {
        this.$router.push({name: 'edit', params: {deletePost: true, title: this.postData.title}, query: {post: this.postData.id}})
      }
    }, this)
    if(WsBus.globalBus) {
      this.$once('destroyed', WsBus.globalBus.addEventListener('post_edited', ({id}) => {
        if (id == this.postData.id) {
          this.loadContent()
        }
      }))
    }
  },
  beforeRouteUpdate (to, from, next) {
    if(to.params.doNotLoad) return next()
    if (to.query.p === from.query.p && this.resolvePostLink(to.params.postLink) == this.resolvePostLink(from.params.postLink)) return next()
    this.$vuetify.goTo(0)
    this.$emit('postUnload')
    this.loadContent(to.query.p, to)
    next()
  },
  destroyed () {
    this.$emit('postUnload')
    this.$emit('postDestroyed')
    flushContext()
    this.renderer && this.renderer.destroy()
  },
  watch: {
    userData () {
      if (!this.userData && this.postData.secret) {
        this.postData = this.notFoundData()
      }
      this.postData.id === -1 && this.loadContent()
    },
    'window.MathJax' () {
      this.renderWithMathJax()
    }
  }
}
</script>

<style>
.blur-image:not(:hover) > .v-parallax__image-container {
  filter: blur(10px) saturate(120%);
}
.blur-image-transition > .v-parallax__image-container {
  transition: 0.5s filter cubic-bezier(0.075, 0.82, 0.165, 1);
}
</style>
<style scoped>
</style>
