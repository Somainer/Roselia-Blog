<template>
  <v-container fluid>
    <v-row>
      <div>
        <div>
          <h1>Clear All Drafts</h1>
          <v-col md="12" lg="12">
            <v-alert type="warning">
              This will remove all post drafts and this action can not be undone.
            </v-alert>
          </v-col>
          <v-btn color="warning" @click="removeDrafts" @mouseleave="confirmClear = false">
            <v-icon>mdi-delete-sweep</v-icon> {{ confirmClear ? 'Yes, ' : '' }}Clear
          </v-btn>
        </div>
      </div>
      <v-col sm="12">
        <div v-if="drafts.length">
          <h1>Manage Drafts</h1>
        </div>
        <v-row>
          <v-col md="6" sm="12">
            <v-scale-transition v-for="post in drafts" :key="post.id">
              <v-card hover class="round-corner-card primary-card-gradient" theme="dark" rounded="lg">
                <v-img v-if="post.img" :src="post.img"></v-img>
                <v-card-title>
                  <div>
                    <span v-if="post.id">#{{ post.id }}</span>
                    <span v-else>New Post</span>
                    <h1 class="text-h5">{{ post.title || 'Untitled' }}</h1>
                    <h2>{{ post.subtitle }}</h2>
                    <span v-if="post.author">{{ post.author.nickname }}</span>
                    <span v-else>{{ userData.nickname }}</span>
                  </div>
                </v-card-title>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn icon="mdi-pencil" :to="{ name: 'edit', query: { post: post.id } }"></v-btn>
                  <v-btn icon="mdi-delete" @click="removeDraft(post.id)"></v-btn>
                </v-card-actions>
              </v-card>
            </v-scale-transition>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  name: 'DraftManage',
  props: {
    toast: { type: Function as PropType<(text: string, color?: string) => void>, required: true },
    userData: { type: Object as PropType<any>, required: true }
  },
  data() {
    return {
      drafts: [] as any[],
      confirmClear: false
    }
  },
  mounted() {
    this.loadDrafts()
  },
  methods: {
    removeDrafts() {
      if (!this.confirmClear) {
        this.confirmClear = true
        return
      }
      this.confirmClear = false
      const storage = localStorage
      Array.from(Array(storage.length).keys())
        .map(i => storage.key(i))
        .filter((x): x is string => !!x && x.startsWith('postDraft'))
        .forEach(k => storage.removeItem(k))
      this.toast('Drafts cleaned!', 'success')
      this.loadDrafts()
    },
    loadDrafts() {
      const storage = localStorage
      this.drafts = Array.from(Array(storage.length).keys())
        .map(i => storage.key(i))
        .filter((x): x is string => !!x && x.startsWith('postDraft'))
        .map(k => JSON.parse(storage.getItem(k) || '{}').data)
        .filter(Boolean)
    },
    removeDraft(pid: any) {
      localStorage.removeItem(`postDraft#${pid}`)
      this.loadDrafts()
    }
  }
})
</script>

<style scoped>
.round-corner-card { border-radius: 25px; }
.primary-card-gradient { background: linear-gradient(20deg, #2b499f, #de94fc); }
.secondary-card-gradient { background: linear-gradient(20deg, rgb(14, 60, 96), rgb(75, 198, 227)); }
</style>
