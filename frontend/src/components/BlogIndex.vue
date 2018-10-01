<template>
  <div>
    <nav-bar :userData="userData" :route="this.$route.fullPath"></nav-bar>
    <v-parallax
      dark
      src="static/img/bg_n3.jpg"
    >
      <v-layout
        align-center
        column
        justify-center
      >
        <h1 class="display-2 font-weight-thin mb-3">{{realTitle || meta.title}}</h1>
        <h4 class="subheading">{{realSubtitle || meta.motto}}</h4>
      </v-layout>
    </v-parallax>

    <v-layout>
      <v-container
        fluid
        grid-list-lg
      >
        <v-layout row wrap>
          <v-flex v-for="post in posts" xs12 sm8 offset-sm2 :key="post.id">
            <v-card hover :to="{name: 'post', params: {p: post.id}, query: {p: post.id}}">
              <v-img v-if="post.img"
                            :src="post.img"
                            ripple="true"
              >
                <v-container fill-height fluid>
                  <v-layout align-end fill-height>
                    <v-flex xs12 align-end flexbox>
                      <router-link v-for="tag in post.tags" :to="{name: 'index', params: {tag: tag}, query: {tag: tag}}" :key="tag">
                        <v-chip>{{tag}}</v-chip>
                      </router-link>
                      <v-chip v-if="post.secret" color="success" text-color="white">
                        <v-avatar>
                          <v-icon>lock</v-icon>{{post.secret}}
                        </v-avatar>
                        Secret
                      </v-chip>
                    </v-flex>
                  </v-layout>
                </v-container>
              </v-img>

              <v-card-title primary-title>
                <div>
                  <div class="headline">{{post.title}}</div>
                  <span class="grey--text">{{post.subtitle}}</span>

                </div>
                <v-spacer></v-spacer>
                <span class="right">{{post.date}}</span>
              </v-card-title>

              <v-card-actions v-if="userData && userData.role && userData.role + 1 >= post.secret">
                <v-spacer></v-spacer>
                <v-btn small fab color="error" :to="{name: 'edit', query: {post: post.id}, params:{deletePost: true, title: post.title}}">
                  <v-icon>delete</v-icon>
                </v-btn>
                <v-btn small fab color="primary" :to="{name: 'edit', query: {post: post.id}}">
                  <v-icon>mode_edit</v-icon>
                </v-btn>
              </v-card-actions>

            </v-card>
          </v-flex>

        </v-layout>
      </v-container>
    </v-layout>
    <v-container>
      <div class="text-xs-center">
        <v-pagination
          v-model="currentPage"
          :length="pages"
          :total-visible="7"
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
  </div>

</template>

<script>
import utils from '../common/utils'
import router from '../router/index'
import meta from '../common/config'

export default {
  name: 'blog-index',
  data () {
    return {
      currentPage: 0,
      prevPage: 0,
      nextPage: 0,
      pages: 0,
      userData: utils.getLoginData(),
      toast: utils.getToastOption(),
      posts: [],
      meta,
      realTitle: '',
      realSubtitle: ''
    }
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
    shiftPage (offset) {
      let page = this.getPageOffset(offset)
      if (page === -1) return
      this.$vuetify.goTo(0)
      this.$router.push({
        name: 'index',
        params: {
          page
        }
      })
    },
    showToast: utils.showToast,
    changeToast (show) {
      this.toast.show = show
    },
    getPostsOnContex (args) {
      args = args || this.getArguments()
      return this.getPosts(args.page, false, args.tag)
    },
    getPosts (page, tried = false, tag) {
      page = page || 1
      // page = page || utils.getArguments().page || 1
      let fetchData = {
        page: page,
        limit: 6
      }
      if (tag) {
        document.title = `${this.meta.title} - Tag: ${tag}`
        this.realTitle = tag
        this.realSubtitle = `Posts for tag: ${tag}`
        fetchData.tag = tag
      } else {
        this.realTitle = ''
        this.realSubtitle = ''
        document.title = `${this.meta.title} - #${page}`
      }

      utils.fetchJSON(utils.apiFor('posts'), 'GET', fetchData).then(data => {
        if (!data.valid && this.userData && !tried) {
          return utils.refreshToken().then(userData => {
            this.userData = userData
            this.getPosts(page, true)
          }).catch(reason => {
            this.showToast(reason, 'warning')
            this.userData = null
            utils.removeLoginData()
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
  },
  mounted () {
    this.getPostsOnContex()
    window.addEventListener('storage', e => {
      if (e.key === 'loginData') {
        this.userData = utils.getLoginData()
      }
    })
  },
  watch: {
    userData() {
      this.getPosts()
    },
    currentPage (page) {
      this.$router.push({
        ...this.$route,
        query: {
          page
        }
      })
    }
  },
  beforeRouteUpdate (to, from, next) {
    this.$vuetify.goTo(0)
    let args = to.query
    this.getPostsOnContex(args)
    next()
  }
}
</script>

<style scoped>

</style>
