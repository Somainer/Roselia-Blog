<template>
  <div>
    <nav-bar :user-data="userData" :route="$route.fullPath"></nav-bar>
    <div v-page-title="realWindowTitle"></div>
    <v-parallax
      :src="bannerImage"
      :class="{
        'blur-image': !!userInfo.username,
        'blur-image-transition': true
      }"
    >
      <v-row align="center" justify="center">
        <v-col cols="12" class="text-center">
          <div v-if="userInfo.avatar">
            <v-avatar size="128" class="elevation-7">
              <v-img :src="userInfo.avatar" :alt="userInfo.username"></v-img>
            </v-avatar>
            <br /><br />
          </div>
          <h1 class="text-h3 font-weight-regular mb-3">{{ realTitle }}</h1>
          <h2 class="text-subtitle-1" v-if="userFound">{{ mottoText }}</h2>
          <h2 class="text-subtitle-1" v-else>This guy is a mystery.</h2>
        </v-col>
      </v-row>
    </v-parallax>
    <v-container>
      <v-card-text class="py-0">
        <v-timeline :density="display.smAndDown.value ? 'compact' : 'default'" side="end">
          <v-timeline-item
            v-for="post in postData"
            :key="post.id"
            fill-dot
            dot-color="accent"
          >
            <template #icon v-if="!userInfo.username && post.author && post.author.avatar">
              <v-avatar>
                <v-img :src="post.author.avatar"></v-img>
              </v-avatar>
            </template>
            <template #opposite>
              <div class="text-h6 font-weight-bold">
                <h4>{{ post.datetime.toLocaleDateString() }}</h4>
                <h3 class="secondary-text" v-if="!userInfo.username">
                  {{ post.author && post.author.nickname }}
                </h3>
                <router-link
                  v-for="tag in post.tags"
                  :to="{ name: 'index', params: { tag }, query: { tag } }"
                  :key="tag"
                >
                  <v-chip>{{ tag }}</v-chip>
                </router-link>
                <v-chip v-if="post.secret" color="success">
                  <template #prepend>
                    <v-icon>mdi-lock</v-icon>
                  </template>
                  Secret {{ post.secret }}
                </v-chip>
              </div>
            </template>
            <div
              class="py-3"
              :class="{
                scale: post.clicked,
                'scale-finished': post.clicked === 1,
                'scale-back': post.clicked === -1
              }"
            >
              <v-card color="primary" elevation="2">
                <v-card-title class="text-h6">{{ post.title }}</v-card-title>
                <v-card-text>
                  <p>{{ post.subtitle }}</p>
                  <v-btn
                    class="mx-0"
                    variant="outlined"
                    rounded
                    color="secondary"
                    icon="mdi-unfold-more-horizontal"
                    @click="manuallyLoadPost(post)"
                  ></v-btn>
                </v-card-text>
              </v-card>
            </div>
          </v-timeline-item>
        </v-timeline>
        <v-row align="center" justify="center">
          <div v-observe-visibility="loadNextPage">
            <div v-if="currentPage < totalPages">
              <v-btn :loading="loading" size="small" block color="secondary" @click="loadNextPage">
                <v-icon>mdi-chevron-down</v-icon>
              </v-btn>
            </div>
            <div v-else-if="loading">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            <div v-else-if="postData.length">
              <v-divider></v-divider>
              Tiro Finale
            </div>
          </div>
        </v-row>
      </v-card-text>
    </v-container>
    <blog-footer></blog-footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { useDisplay } from 'vuetify'
import utils from '../common/utils'
import { mapToCamelCase } from '../common/helpers'
import meta from '../common/config'

export default defineComponent({
  name: 'blog-timeline',
  props: {
    userData: { type: Object as PropType<any>, default: null }
  },
  setup() {
    return { display: useDisplay(), config: meta }
  },
  data() {
    return {
      currentPage: 1,
      totalPages: 1,
      postData: [] as any[],
      loading: false,
      hasLeft: false,
      fromPost: 0 as any,
      userInfo: {
        username: '',
        avatar: '',
        nickname: '',
        banner: '',
        motto: ''
      },
      userFound: true
    }
  },
  computed: {
    realTitle(): string {
      return this.userInfo.nickname || this.userInfo.username || (this.$route.meta.title as string)
    },
    bannerImage(): string {
      return (this.userInfo && this.userInfo.banner) || this.config.images.timelineBannerImage
    },
    mottoText(): string {
      return this.userInfo.motto ||
        'The fate of a person, of course, depends on self-strengthening, but also on the journey of the history.'
    },
    realWindowTitle(): string {
      return this.userInfo.username
        ? `${this.userInfo.nickname}'s Timeline`
        : (this.$route.meta.title as string)
    }
  },
  watch: {
    userData() {
      this.currentPage = 1
      this.totalPages = 1
      this.getPostData(1, false)
    }
  },
  mounted() {
    const params = this.$route.params as any
    if (params.username) {
      this.userInfo.username = this.userInfo.nickname = params.username
      this.getUserMeta()
    }
    this.getPostData(1, false)
  },
  beforeRouteEnter(_to, from, next) {
    next((vm: any) => {
      vm.fromPost = from.query.p || (from.params as any).postLink
    })
  },
  methods: {
    getPostData(page?: number, append = true) {
      page = page || this.currentPage
      const fetchData = { page, limit: 6 }
      this.loading = true
      const api = this.userInfo.username
        ? utils.apiFor('post', 'user', this.userInfo.username)
        : utils.apiFor('posts')
      utils.fetchJSON(api, 'GET', fetchData).then((data: any) => {
        const postData = data.data.map(mapToCamelCase).map((d: any) => ({
          ...d,
          datetime: new Date(d.created),
          clicked: false
        }))
        this.postData = append ? this.postData.concat(postData) : postData
        this.totalPages = parseInt(data.pages)
        if (this.fromPost) {
          const post = this.findPostBy(this.fromPost)
          if (post) {
            post.clicked = -1
            this.fromPost = 0
            setTimeout(() => { post.clicked = false }, 1000)
          }
        }
        this.loading = false
      }).catch((err: any) => {
        console.error(err)
        this.loading = false
      })
    },
    manuallyLoadPost(post: any) {
      post.clicked = true
      utils.fetchJSON(utils.apiFor('post', post.id)).then((data: any) => {
        if (!data) return Promise.reject(ReferenceError('NPE'))
        const postData = mapToCamelCase(data)
        post.clicked = 1
        this.$router.push({
          name: 'post',
          params: { changeRoute: !!post.displayId, data: postData },
          query: { p: post.id }
        } as any)
      }).catch(() => {
        post.clicked = 1
        this.$router.push({ name: 'post', query: { p: post.id } })
      })
    },
    loadNextPage() {
      if (this.currentPage >= this.totalPages) return
      this.getPostData(++this.currentPage)
    },
    findPostBy(id: any) {
      return this.postData.find(p => p.id == id || p.displayId === id)
    },
    getUserMeta() {
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'user-meta'), 'GET', {
        username: this.userInfo.username
      }).then((data: any) => {
        this.userInfo = mapToCamelCase(data)
      }).catch(() => {
        this.userFound = false
        this.userInfo.nickname = 'John Appleseed'
      })
    }
  }
})
</script>

<style scoped>
@keyframes scale-anime {
  from { transform: scale(1); }
  to { transform: scale(10); }
}
.scale { animation: scale-anime 1s ease-in-out forwards; }
.scale-back { animation: scale-anime 1s ease-in-out reverse forwards; }
.scale-finished { transform: scale(10); }
</style>
