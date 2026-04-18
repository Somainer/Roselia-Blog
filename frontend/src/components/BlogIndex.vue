<template>
  <div>
    <nav-bar :user-data="userData" :route="$route.fullPath"></nav-bar>
    <v-parallax :src="meta.images.indexBannerImage">
      <v-row align="center" justify="center">
        <v-col cols="12" class="text-center">
          <h1 class="text-h3 font-weight-thin mb-3 text-white">{{ realTitle || meta.title }}</h1>
          <h4 class="text-subtitle-1 text-white">{{ realSubtitle || meta.motto }}</h4>
        </v-col>
      </v-row>
    </v-parallax>

    <v-container fluid>
      <v-row v-if="!posts.length">
        <v-col v-for="idx in 6" :key="idx" cols="12" sm="8" offset-sm="2">
          <v-skeleton-loader
            elevation="2"
            :class="{ 'round-corner-card': display.smAndUp.value }"
            class="mb-6"
            type="card"
          ></v-skeleton-loader>
        </v-col>
      </v-row>

      <v-row>
        <v-col v-for="post in posts" cols="12" sm="8" offset-sm="2" :key="post.id">
          <v-card
            hover
            :ripple="false"
            :rounded="display.smAndUp.value ? 'lg' : undefined"
            :to="getRoute(post)"
            :class="{ 'round-corner-card': display.smAndUp.value }"
          >
            <v-img
              v-if="post.img"
              :src="post.img"
              :lazy-src="meta.images.lazyloadImage"
            >
              <v-container class="fill-height" fluid>
                <v-row align="end" class="fill-height">
                  <v-col cols="12" align-self="end">
                    <router-link
                      v-for="tag in post.tags"
                      :to="{ name: 'index', params: { tag }, query: { tag } }"
                      :key="tag"
                    >
                      <v-chip class="ma-1">{{ tag }}</v-chip>
                    </router-link>
                    <v-chip v-if="post.secret" class="ma-1" color="success">
                      <template #prepend>
                        <v-icon>mdi-lock</v-icon>
                      </template>
                      Secret {{ post.secret }}
                    </v-chip>
                    <v-chip v-if="post.hidden" class="ma-1" color="grey">
                      <template #prepend>
                        <v-icon>mdi-eye-off</v-icon>
                      </template>
                      Hidden
                    </v-chip>
                  </v-col>
                </v-row>
              </v-container>
            </v-img>

            <v-card-title>
              <div>
                <div class="text-h5">{{ post.title }}</div>
                <span class="text-grey text-subtitle-1">{{ post.subtitle }}</span>
              </div>
              <v-spacer></v-spacer>
              <span class="text-caption">{{ formatDate(post.created) || post.date }}</span>
            </v-card-title>

            <v-col v-if="!post.img" cols="12" align-self="end">
              <router-link
                v-for="tag in post.tags"
                :to="{ name: 'index', params: { tag }, query: { tag } }"
                :key="tag"
              >
                <v-chip class="ma-1">{{ tag }}</v-chip>
              </router-link>
              <v-chip v-if="post.secret" class="ma-1" color="success">
                <template #prepend><v-icon>mdi-lock</v-icon></template>
                Secret {{ post.secret }}
              </v-chip>
              <v-chip v-if="post.hidden" class="ma-1" color="grey">
                <template #prepend><v-icon>mdi-eye-off</v-icon></template>
                Hidden
              </v-chip>
            </v-col>

            <v-card-title>
              <span class="text-grey text-subtitle-1">{{ post.author.nickname }}</span>
            </v-card-title>

            <v-card-actions v-if="userData && userData.role && userData.role >= post.author.role">
              <v-spacer></v-spacer>
              <v-btn
                size="small"
                icon="mdi-delete"
                color="error"
                :to="{ name: 'edit', query: { post: post.id }, params: { deletePost: true, title: post.title } }"
              ></v-btn>
              <v-btn
                size="small"
                icon="mdi-pencil"
                color="primary"
                :to="{ name: 'edit', query: { post: post.id } }"
              ></v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-container>
      <div class="text-center">
        <v-pagination v-model="currentPage" :length="pages"></v-pagination>
      </div>
    </v-container>

    <toast v-model="toast.show" :text="toast.text" :color="toast.color"></toast>
    <blog-footer></blog-footer>
    <div v-page-title="windowTitle"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { useDisplay, useGoTo } from 'vuetify'
import utils from '../common/utils'
import { mapToCamelCase } from '../common/helpers'
import meta from '../common/config'
import { pushContext, flushContext } from '../custom-command/luis'

export default defineComponent({
  name: 'blog-index',
  props: {
    userData: { type: Object as PropType<any>, default: null }
  },
  emits: ['roselia-load'],
  setup() {
    return { display: useDisplay(), goTo: useGoTo() }
  },
  data() {
    return {
      currentPage: 1,
      prevPage: 0,
      nextPage: 0,
      pages: 0,
      toast: utils.getToastOption(),
      posts: [] as any[],
      meta,
      realTitle: '',
      realSubtitle: '',
      windowTitle: ''
    }
  },
  mounted() {
    this.getPostsOnContext()
    pushContext({
      'Utilities.ShowNext': () => {
        if (this.nextPage !== -1) this.showToast('Taking you to the next page...')
        else this.showToast('No more pages...', 'error')
        this.shiftPage(1)
      },
      'Utilities.ShowPrevious': () => {
        if (this.prevPage !== -1) this.showToast('Taking you to the previous page...')
        else this.showToast('No more pages...', 'error')
        this.shiftPage(-1)
      }
    }, this)
  },
  unmounted() {
    flushContext()
  },
  watch: {
    userData() {
      if (this.pages) this.getPosts()
    },
    currentPage(page: number) {
      this.$router.push({
        ...this.$route,
        query: { ...this.$route.query, page: page === 1 ? undefined : page }
      } as any)
    }
  },
  beforeRouteUpdate(to, _from, next) {
    this.goTo(0)
    this.getPostsOnContext(to.query)
    next()
  },
  methods: {
    makeDirect(frm: any) {
      utils.setRedirect(utils.getAbsPath())
      this.$router.push(frm)
    },
    getTag() {
      return this.getArguments().tag || null
    },
    getArguments() {
      return this.$route.query as any
    },
    getPageOffset(offset: number) {
      const page = parseInt(this.getArguments().page as any) || 1
      const res = page + offset
      if (res > 0 && res <= this.pages) return res
      return -1
    },
    formatDate(date: any) {
      return utils.formatDate(date)
    },
    shiftPage(offset: number) {
      const page = this.getPageOffset(offset)
      if (page === -1) return
      this.goTo(0)
      this.$router.push({ name: 'index', query: { page } })
    },
    showToast(text: string, color?: string) {
      return utils.showToast.call(this, text, color)
    },
    getPostsOnContext(args?: any) {
      args = args || this.getArguments()
      return this.getPosts(args.page, false, args.tag)
    },
    getPosts(page?: any, tried = false, tag?: string) {
      page = page || 1
      this.posts = []
      const fetchData: any = { page, limit: 6 }
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
      utils.fetchJSON(utils.apiFor('posts'), 'GET', fetchData).then((data: any) => {
        if (!data.valid && this.userData && !tried) {
          utils.refreshToken().then((userData: any) => {
            ;(this as any).userData = userData
            this.getPosts(page, true)
          }).catch((reason: any) => {
            this.showToast(reason, 'warning')
            ;(this as any).userData = null
            utils.removeLoginData()
          })
        }
        if (!data.total) {
          utils.fetchJSONWithSuccess(utils.apiFor('firstrun')).then(() => {
            this.$router.push({ name: 'helloWorld' })
          })
        }
        this.posts = data.data.map((o: any) => {
          o.deleted = false
          return o
        })
        this.pages = parseInt(data.pages)
        this.currentPage = parseInt(page)
        this.nextPage = this.getPageOffset(1)
        this.prevPage = this.getPageOffset(-1)
        this.$emit('roselia-load')
      }).catch((reason: any) => {
        console.log(reason)
      })
    },
    getRoute(post: any) {
      post = mapToCamelCase(post)
      if (post.displayId) {
        return { name: 'postWithEternalLink', params: { postLink: post.displayId.split('/') } }
      }
      return { name: 'post', query: { p: post.id } }
    }
  }
})
</script>

<style scoped>
.round-corner-card {
  border-radius: 25px;
}
</style>
