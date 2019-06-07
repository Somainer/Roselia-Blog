<template>
<v-container fluid>
  <v-layout row wrap>
    <div>
      <div>
        <h1>Clear All Drafts</h1>
        <v-flex md12 lg12>
          <v-alert :value="true" type="warning">
            This will remove all post drafts and this action can not be undone.
          </v-alert>
        </v-flex>
        <v-btn @click="removeDrafts" color="warning" @mouseleave="confirmClear = false">
          <v-icon>delete_sweep</v-icon> {{ confirmClear ? 'Yes, ' : '' }}Clear
        </v-btn>
      </div>
    </div>
    <v-flex xs12 sm12>
      <div v-if="drafts.length">
        <h1>Manage Drafts</h1>
      </div>
      <v-layout row wrap>
        <v-flex md6 sm12>
          <v-scale-transition
                  v-for="post in drafts"
                  :key="post.id">
            <v-card
                    hover
                    class="round-corner-card primary-card-gradient"
                    dark
            >
              <v-img v-if="post.img"
                     :src="post.img"
              >
              </v-img>
              <v-card-title primary-title>
                <div>
                  <span v-if="post.id">#{{ post.id }}</span>
                  <span v-else>New Post</span>
                  <h1 class="headline">{{ post.title || "Untitled" }}</h1>
                  <h2>
                    {{ post.subtitle }}
                  </h2>
                  <span  v-if="post.author">
                    {{ post.author.nickname }}
                  </span>
                  <span v-else>{{ userData.nickname }}</span>
                </div>
              </v-card-title>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn icon
                       :to="{name: 'edit', query: {post: post.id}}">
                  <v-icon>mode_edit</v-icon>
                </v-btn>
                <v-btn icon @click="removeDraft(post.id)">
                  <v-icon>delete</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-scale-transition>

        </v-flex>
      </v-layout>

    </v-flex>
  </v-layout>
</v-container>
</template>

<script>
export default {
  name: "DraftManage",
  props: {
    toast: Function,
    userData: Object
  },
  data() {
    return {
      drafts: [],
      confirmClear: false
    };
  },
  methods: {
    removeDrafts() {
      if(!this.confirmClear) {
        this.confirmClear = true
        return
      }
      this.confirmClear = false
      const storage = localStorage
      Array.from(Array(storage.length).keys())
              .map(storage.key.bind(storage))
              .filter(x => x.startsWith('postDraft'))
              .forEach(k => {
                storage.removeItem(k)
              })
      this.toast('Drafts cleaned!', 'success')
      this.loadDrafts()
    },
    loadDrafts() {
      const storage = localStorage
      this.drafts = Array.from(Array(storage.length).keys())
              .map(storage.key.bind(storage))
              .filter(x => x.startsWith('postDraft'))
              .map(k => {
                return JSON.parse(storage.getItem(k)).data
              })
    },
    removeDraft(pid) {
      localStorage.removeItem(`postDraft#${pid}`)
      this.loadDrafts()
    }
  },
  computed: {
  },
  mounted() {
    this.loadDrafts()
  }
};
</script>

<style scoped>
.round-corner-card {
  border-radius: 25px;
}
.primary-card-gradient {
  background: linear-gradient(20deg, #2b499f, #de94fc);
}
.secondary-card-gradient {
  background: linear-gradient(20deg, rgb(14, 60, 96), rgb(75, 198, 227));
}
</style>
