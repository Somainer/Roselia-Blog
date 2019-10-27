<template>
  <div>
    <nav-bar :userData="userData" :route="this.$route.fullPath"></nav-bar>
    <v-parallax
      dark
      :src="meta.images.indexBannerImage"
    >
      <v-row
        align="center"
        justify="center"
      >
        <v-col cols="12" class="text-center">
          <h1 class="display-2 font-weight-thin mb-3">{{realTitle || meta.title}}</h1>
          <h4 class="subheading">{{realSubtitle || meta.motto}}</h4>
        </v-col>
      </v-row>
    </v-parallax>

    <v-layout>
      <v-container
        fluid
        grid-list-lg
      >
        <v-row wrap v-if="!posts.length">
          <v-col v-for="idx in 6" :key="idx" cols="12" xs="12" sm="8" offset-sm="2">
            <v-skeleton-loader
                    elevation="2"
                    :class="{'round-corner-card': $vuetify.breakpoint.smAndUp}"
                    class="mb-6"
                    type="card"
            ></v-skeleton-loader>
          </v-col>
        </v-row>
        <v-row wrap>
          <v-col v-for="post in posts" cols="12" xs="12" sm="8" offset-sm="2" :key="post.id">
              <v-card hover :ripple="false" :shaped="$vuetify.breakpoint.smAndUp" :to="getRoute(post)"
                      :class="{'round-corner-card': $vuetify.breakpoint.smAndUp}">
              <!-- {name: 'post', params: {p: post.id}, query: {p: post.id}} -->
              <v-img v-if="post.img"
                    :src="post.img"
                    :lazy-src="meta.images.lazyloadImage"
                    ripple="true"
              >
                <v-container class="fill-height" fluid>
                  <v-row align="end" class="fill-height">
                    <v-col xs="12" align-self="end" flexbox>
                      <router-link v-for="tag in post.tags" :to="{name: 'index', params: {tag: tag}, query: {tag: tag}}" :key="tag">
                        <v-chip class="ma-1">{{tag}}</v-chip>
                      </router-link>
                      <v-chip class="ma-1" v-if="post.secret" color="success" text-color="white">
                        <v-avatar left>
                          <v-icon>lock</v-icon>{{post.secret}}
                        </v-avatar>
                        Secret
                      </v-chip>
                      <v-chip class="ma-1" v-if="post.hidden" color="grey" text-color="white">
                        <v-avatar left>
                          <v-icon>visibility_off</v-icon>
                        </v-avatar>
                        Hidden
                      </v-chip>
                    </v-col>
                  </v-row>
                </v-container>
              </v-img>

              <v-card-title primary-title>
                <div>
                  <div class="headline">{{post.title}}</div>
                  <span class="grey--text subtitle-1">{{post.subtitle}}</span>

                </div>
                <v-spacer></v-spacer>
                <span class="right caption">{{formatDate(post.created) || post.date}}</span>
              </v-card-title>
              <v-col xs="12" align-self="end" flexbox v-if="!post.img">
                <router-link v-for="tag in post.tags" :to="{name: 'index', params: {tag: tag}, query: {tag: tag}}" :key="tag">
                  <v-chip class="ma-1">{{tag}}</v-chip>
                </router-link>
                <v-chip class="ma-1" v-if="post.secret" color="success" text-color="white">
                  <v-avatar>
                    <v-icon>lock</v-icon>{{post.secret}}
                  </v-avatar>
                  Secret
                </v-chip>
                <v-chip class="ma-1" v-if="post.hidden" color="grey" text-color="white">
                  <v-avatar>
                    <v-icon>visibility_off</v-icon>
                  </v-avatar>
                  Hidden
                </v-chip>
              </v-col>
              <v-card-title>
                <span class="grey--text subtitle-1">{{post.author.nickname}}</span>
              </v-card-title>
              <v-card-actions v-if="userData && userData.role && userData.role >= post.author.role">
                <v-spacer></v-spacer>
                <v-btn small fab color="error" :to="{name: 'edit', query: {post: post.id}, params:{deletePost: true, title: post.title}}">
                  <v-icon>delete</v-icon>
                </v-btn>
                <v-btn small fab color="primary" :to="{name: 'edit', query: {post: post.id}}">
                  <v-icon>mode_edit</v-icon>
                </v-btn>
              </v-card-actions>

            </v-card>
          </v-col>

        </v-row>
      </v-container>
    </v-layout>
    <v-container>
      <div class="text-xs-center">
        <v-pagination
          v-model="currentPage"
          :length="pages"
          circle
        ></v-pagination>
      </div>
      <!--
      <v-flex row xs12 sm10 offset-sm1>
        <v-layout>
          <v-btn color="primary" fab small v-if="prevPage !== -1" :to="{name: 'index', query: {page: prevPage}}">
            <v-icon>chevron_left</v-icon>
          </v-btn>
          <v-spacer></v-spacer>
          {{currentPage}} / {{pages}}
          <v-spacer></v-spacer>
          <v-btn color="primary" fab small v-if="nextPage !== -1" :to="{name: 'index', query: {page: nextPage}}">
            <v-icon>chevron_right</v-icon>
          </v-btn>
        </v-layout>
      </v-flex>
      -->
      
    </v-container>

  <toast v-bind="toast" @showChange="changeToast"></toast>
    <blog-footer></blog-footer>
    <div v-wechat-title="windowTitle"></div>
  </div>

</template>

<script>
import utils from '../common/utils'
import {mapToCamelCase} from '../common/helpers'
// import router from '../router/index'
import meta from '../common/config'
import {pushContext, flushContext} from '../custom-command/luis'

export default {
  name: 'blog-index',
  data () {
    return {
      currentPage: 1,
      prevPage: 0,
      nextPage: 0,
      pages: 0,
      toast: utils.getToastOption(),
      posts: [],
      meta,
      realTitle: '',
      realSubtitle: '',
      windowTitle: ''
    }
  },
  props: {
    userData: Object
  },
  methods: {
    makeDirect (frm) {
      utils.setRedirect(utils.getAbsPath())
      this.$router.push(frm)
    },
    getTag () {
      return this.getArguments().tag || null
    },
    getArguments () {
      return this.$route.query
    },
    getPageOffset (offset) {
      let page = parseInt(this.getArguments().page) || 1
      let res = page + offset
      if (res > 0 && res <= this.pages) return res
      return -1
    },
    formatDate(date) {
      return utils.formatDate(date)
    },
    shiftPage (offset) {
      let page = this.getPageOffset(offset)
      if (page === -1) return
      this.$vuetify.goTo(0)
      this.$router.push({
        name: 'index',
        query: {
          page
        }
      })
    },
    showToast(text, color) {
      return utils.showToast.call(this, text, color)
    },
    changeToast (show) {
      this.toast.show = show
    },
    getPostsOnContext (args) {
      args = args || this.getArguments()
      return this.getPosts(args.page, false, args.tag)
    },
    getPosts (page, tried = false, tag) {
      page = page || 1
      // page = page || utils.getArguments().page || 1
      this.posts = [];
      let fetchData = {
        page: page,
        limit: 6
      }
      if (tag) {
        this.windowTitle = `${this.meta.title} - Tag: ${tag}`
        this.realTitle = tag
        this.realSubtitle = `Posts for tag: ${tag}`
        fetchData.tag = tag
      } else {
        this.realTitle = ''
        this.realSubtitle = ''
        this.windowTitle = `${this.meta.title} - #${page}`
      }
      utils.fetchJSON(utils.apiFor('posts'), 'GET', fetchData).then(data => {
        if (!data.valid && this.userData && !tried) {
          utils.refreshToken().then(userData => {
            this.userData = userData
            this.getPosts(page, true)
          }).catch(reason => {
            this.showToast(reason, 'warning')
            this.userData = null
            utils.removeLoginData()
          })
        }
        if(!data.total) {
          utils.fetchJSONWithSuccess(utils.apiFor('firstrun')).then(s => {
            this.$router.push({
              name: 'helloWorld'
            })
          })
        }
        this.posts = data.data.map(o => {
          o.deleted = false
          return o
        })
        this.pages = parseInt(data.pages)
        this.currentPage = parseInt(page)
        this.nextPage = this.getPageOffset(1)
        this.prevPage = this.getPageOffset(-1)
        this.$emit('roselia-load')
      }).catch(reason => {
        console.log(reason)
      })
    },
    getRoute(post) {
      post = mapToCamelCase(post)
      if(post.displayId) {
        return {
          name: 'postWithEternalLink',
          params: {
            postLink: post.displayId
          }
        }
      }
      return {
        name: 'post',
        query: {
          p: post.id
        }
      }
    }
  },
  mounted () {
    this.getPostsOnContext()
    pushContext({
      "Utilities.ShowNext" () {
        if(this.nextPage !== -1) this.showToast('Taking you to the next page...')
        else this.showToast('No more pages...', 'error')
        this.shiftPage(1)
      },
      "Utilities.ShowPrevious"() {
        if(this.prevPage !== -1) this.showToast('Taking you to the previous page...')
        else this.showToast('No more pages...', 'error')
        this.shiftPage(-1)
      }
    }, this)
  },
  computed: {
    
  },
  watch: {
    userData() {
      if(this.pages) this.getPosts()
    },
    currentPage (page) {
      this.$router.push({
        ...this.$route,
        query: {
          ...this.$route.query,
          page: page === 1 ? undefined : page
        }
      })
    }
  },
  beforeRouteUpdate (to, from, next) {
    this.$vuetify.goTo(0)
    let args = to.query
    this.getPostsOnContext(args)
    next()
  },
  destroyed() {
    flushContext()
  }
}
</script>

<style scoped>
.round-corner-card {
  border-radius: 25px;
}
</style>
