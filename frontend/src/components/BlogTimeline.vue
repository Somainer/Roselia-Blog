<template>
  <div>
    <nav-bar :userData="userData" :route="this.$route.fullPath"></nav-bar>
    <v-parallax
      dark
      src="static/img/bg_n0.png"
    >
      <v-layout
        align-center
        column
        justify-center
      >
        <h1 class="display-2 font-weight-regular mb-3">Timeline</h1>
        <h2 class="subheading">
          The fate of a person, of course, depends on self-strengthening, but also on the journey of the history.
        </h2>
      </v-layout>
    </v-parallax>
    <v-container>
      <v-card-text class="py-0">
        <v-timeline
          align-top
          :dense="$vuetify.breakpoint.smAndDown"
        >
          <v-timeline-item
            v-for="(post, i) in postData"
            :key="i"
            fill-dot
            color="accent"
          >
            <span
              slot="opposite"
              class="headline font-weight-bold"
            >
              {{ post.datetime.toLocaleDateString() }}
              <router-link v-for="tag in post.tags" :to="{name: 'index', params: {tag: tag}, query: {tag: tag}}" :key="tag">
                  <v-chip>{{tag}}</v-chip>
              </router-link>
              <v-chip v-if="post.secret" color="success" text-color="white">
                <v-avatar>
                  <v-icon>lock</v-icon>{{post.secret}}
                </v-avatar>
                Secret
              </v-chip>
            </span>
            <div class="py-3">
              <!-- <h2 class="headline font-weight-light mb-3 primary--text">{{post.title}}</h2>
              <div>
                {{post.subtitle}}
              </div> -->
              <v-card
                dark
                color="primary"
              >
                <v-card-title class="title">{{post.title}}</v-card-title>
                
                <v-card-text>
                  <p>{{post.subtitle}}</p>
                  <v-btn
                    class="mx-0"
                    outline
                    color="secondary"
                    :to="{name: 'post', query: {p: post.id}}"
                  >
                    <v-icon>unfold_more</v-icon>
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>
          </v-timeline-item>
        </v-timeline>
        <v-layout
          align-center
          column
          justify-center
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
                Tiro finale
            </div>
            
          </div>
        </v-layout>
      </v-card-text>
    </v-container>
  </div>
</template>
<script>
import utils from "../common/utils";
export default {
  data() {
    return {
      currentPage: 1,
      totalPages: 1,
      userData: utils.getLoginData(),
      postData: [],
      loading: false
    };
  },
  methods: {
    getPostData(page, append = true) {
      page = page || this.currentPage;
      const fetchData = {
        page,
        limit: 6
      };
      this.loading = true
      utils.fetchJSON(utils.apiFor("posts"), "GET", fetchData).then(data => {
        const postData = data.data.map(d => ({
          ...d,
          datetime: new Date(d.time * 1000)
        }))
        this.postData = append ? this.postData.concat(postData) : postData;
        this.totalPages = parseInt(data.pages);
        this.loading = false
      }).catch(err => {
        console.error(err)
        this.loading = false
      });
    },
    loadNextPage() {
      if (this.currentPage >= this.totalPages) return
      this.getPostData(++this.currentPage)
    }
  },
  mounted() {
    this.getPostData(1, false);
    window.addEventListener("storage", e => {
      if (e.key === "loginData") {
        this.userData = utils.getLoginData();
      }
    });
  },
  watch: {
    userData() {
      this.currentPage = 1;
      this.totalPages = 1;
      this.getPostData(1, false);
    }
  }
};
</script>
