<template>
  <div>
    <nav-bar :userData="userData" :route="this.$route.fullPath"></nav-bar>
    <div v-wechat-title="realWindowTitle"></div>
    <v-parallax
      dark
      :src="bannerImage"
    >
      <v-row
        align="center"
        column
        justify="center"
      >
        <v-col cols="12" class="text-center">
          <div v-if="userInfo.avatar">
            <v-avatar
                    size="128px"
                    class="elevation-7"
            >
              <v-img
                      :src="userInfo.avatar"
                      :alt="userInfo.username"
              ></v-img>
            </v-avatar>
            <br/><br/>
          </div>
          <h1 class="display-2 font-weight-regular mb-3">{{ realTitle }}</h1>
          <h2 class="subtitle-1" v-if="userFound">
            {{ mottoText }}
          </h2>
          <h2 class="subtitle-1" v-else>
            This guy is a mystery.
          </h2>
        </v-col>
      </v-row>
    </v-parallax>
    <v-container>
      <v-card-text class="py-0">
        <v-timeline
          :dense="$vuetify.breakpoint.smAndDown"
        >
        <v-slide-x-transition group>
          <v-timeline-item
            v-for="(post) in postData"
            :key="post.id"
            fill-dot
            color="accent"
          >
            <v-avatar v-if="!userInfo.username && post.author && post.author.avatar" slot="icon">
              <v-img :src="post.author.avatar"></v-img>
            </v-avatar>
            <div
              slot="opposite"
              class="headline font-weight-bold"
            >
              <h4>{{ post.datetime.toLocaleDateString() }}</h4>
              <h3 class="secondary-text" v-if="!userInfo.username">{{ post.author && post.author.nickname }}</h3>
              <router-link v-for="tag in post.tags" :to="{name: 'index', params: {tag: tag}, query: {tag: tag}}" :key="tag">
                  <v-chip>{{tag}}</v-chip>
              </router-link>
              <v-chip v-if="post.secret" color="success" text-color="white">
                <v-avatar left>
                  <v-icon>lock</v-icon>{{post.secret}}
                </v-avatar>
                Secret
              </v-chip>
            </div>
            <div class="py-3"
            :class="{scale: post.clicked, 'scale-finished': post.clicked === 1, 'scale-back': post.clicked === -1}">
              <!-- <h2 class="headline font-weight-light mb-3 primary--text">{{post.title}}</h2>
              <div>
                {{post.subtitle}}
              </div> -->
              <v-card
                dark
                color="primary"
                elevation="2"
              >
                <v-card-title class="title">{{post.title}}</v-card-title>
                
                <v-card-text>
                  <p>{{post.subtitle}}</p>
                  <v-btn
                    class="mx-0"
                    outlined
                    rounded
                    color="secondary"
                    @click="manuallyLoadPost(post)"
                  >
                    <v-icon>unfold_more</v-icon>
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>
          </v-timeline-item>
        </v-slide-x-transition>
        </v-timeline>
        <v-row
          align="center"
          column
          justify="center"
        >
          <div v-observe-visibility="loadNextPage">
            <div v-if="currentPage < totalPages">
              <v-btn :loading="loading" small @click="loadNextPage" block color="secondary" dark>
                  <v-icon>keyboard_arrow_down</v-icon>
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
<script>
import utils from "../common/utils";
import {mapToCamelCase} from '../common/helpers';
export default {
  data() {
    return {
      currentPage: 1,
      totalPages: 1,
      postData: [],
      loading: false,
      hasLeft: false,
      fromPost: 0,
      userInfo: {
        username: '',
        avatar: '',
        nickname: '',
        banner: '',
        motto: ''
      },
      userFound: true
    };
  },
  props: {
    userData: Object
  },
  methods: {
    getPostData(page, append = true) {
      page = page || this.currentPage;
      const fetchData = {
        page,
        limit: 6
      };
      this.loading = true
      utils.fetchJSON(this.userInfo.username ? utils.apiFor('post', 'user', this.userInfo.username) : utils.apiFor("posts"), "GET", fetchData).then(data => {
        const postData = data.data.map(mapToCamelCase).map(d => ({
          ...d,
          datetime: new Date(d.created),
          clicked: false
        }))
        this.postData = append ? this.postData.concat(postData) : postData;
        this.totalPages = parseInt(data.pages);
        if(this.fromPost) {
          const post = this.findPostBy(this.fromPost)
          if(post) {
            post.clicked = -1
            this.fromPost = 0
            setTimeout(() => {
              post.clicked = false
            }, 1000)
          }
        }
        this.loading = false
      }).catch(err => {
        console.error(err)
        this.loading = false
      });
    },
    manuallyLoadPost(post) {
      post.clicked = true
      utils.fetchJSON(utils.apiFor('post', post.id)).then(data => {
        if (!data) return Promise.reject(ReferenceError('NPE'))
        const postData = mapToCamelCase(data)
        post.clicked = 1
        this.$router.push({
          name: 'post',
          params: {
            changeRoute: !!post.displayId,
            data: postData
          },
          query: {
            p: post.id
          }
        })
      }).catch(_ => {
        post.clicked = 1
        this.$router.push({
          name: 'post',
          query: {
            p: post.id
          }
        })
      })
    },
    loadNextPage() {
      if (this.currentPage >= this.totalPages) return
      this.getPostData(++this.currentPage)
    },
    findPostBy(id) {
      return this.postData.find(p => p.id == id || p.displayId === id)
    },
    getUserMeta() {
      utils.fetchJSONWithSuccess(utils.apiFor('user', 'user-meta'), 'GET', {
        username: this.userInfo.username
      }).then(data => {
        this.userInfo = mapToCamelCase(data)
      }).catch(err => {
        this.userFound = false
        this.userInfo.nickname = 'John Appleseed'
      })
    }
  },
  mounted() {
    if(this.$route.params.username) {
      this.userInfo.username = this.userInfo.nickname = this.$route.params.username
      this.getUserMeta()
    }
    this.getPostData(1, false);
  },
  watch: {
    userData() {
      this.currentPage = 1;
      this.totalPages = 1;
      this.getPostData(1, false);
    }
  },
  computed: {
    realTitle() {
      return this.userInfo.nickname || this.userInfo.username || this.$route.meta.title
    },
    bannerImage() {
      return (this.userInfo && this.userInfo.banner) || this.config.images.timelineBannerImage
    },
    mottoText() {
      return this.userInfo.motto || 'The fate of a person, of course, depends on self-strengthening, but also on the journey of the history.'
    },
    realWindowTitle() {
      return this.userInfo.username ? `${this.userInfo.nickname}'s Timeline` : this.$route.meta.title
    }
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      vm.fromPost = from.query.p || from.params.postLink
    })
  }
};
</script>
<style scoped>
@keyframes scale-anime {
  from {
    transform: scale(1);
  }
  
  to {
    transform: scale(10);
  }
}
.scale {
  animation: scale-anime 1s ease-in-out forwards;
}
.scale-back {
  animation: scale-anime 1s ease-in-out reverse forwards;
}
.scale-finished {
  transform: scale(10);
}

</style>
