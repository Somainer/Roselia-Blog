<template>
  <div>
    <v-app-bar
      v-if="!shouldHide"
      color="primary"
      density="default"
    >
      <v-app-bar-nav-icon v-if="shouldHaveToolbar" @click="drawer = !drawer"></v-app-bar-nav-icon>
      <slot></slot>
      <v-toolbar-title>
        <router-link class="themed-text no-deco" :to="{ name: 'index' }">{{ title }}</router-link>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <template v-if="!shouldHaveToolbar">
        <v-btn variant="text" v-if="canAskYukina || canChatWithContextualUser" @click="dialog = true">
          <v-badge color="secondary" :content="String(notifications.length)" :model-value="notifications.length > 0">
            <v-icon>mdi-message-question</v-icon>
          </v-badge>
        </v-btn>
        <v-btn variant="text" to="/">Index</v-btn>
        <v-btn variant="text" to="/timeline">Timeline</v-btn>
        <v-btn variant="text" v-if="userData" to="/userspace">{{ userData.nickname }}</v-btn>
        <v-btn
          v-else
          variant="text"
          :to="{ name: 'login' }"
          @click="setRedirect"
          @contextmenu="portedLogin($event)"
        >Login</v-btn>
      </template>
    </v-app-bar>

    <v-navigation-drawer
      v-if="shouldHaveToolbar && !shouldHide"
      v-model="drawer"
      temporary
    >
      <v-list>
        <v-list-item :title="title"></v-list-item>
      </v-list>
      <v-divider></v-divider>
      <v-list density="compact">
        <v-list-item to="/" prepend-icon="mdi-home" title="Index"></v-list-item>
        <v-list-item to="/timeline" prepend-icon="mdi-timeline" title="Timeline"></v-list-item>
        <v-list-item
          v-if="userData"
          to="/userspace"
          prepend-icon="mdi-account-circle"
          :title="userData.nickname"
        ></v-list-item>
        <v-list-item
          v-else
          to="/login"
          prepend-icon="mdi-account"
          title="Login"
          @click="setRedirect"
        ></v-list-item>
        <v-list-item
          v-if="canAskYukina || canChatWithContextualUser"
          prepend-icon="mdi-message-question"
          :title="canChatWithContextualUser ? `Chat with ${contextualUsername}` : 'Ask Yukina for Help'"
          @click="dialog = true"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <div v-if="canChatWithContextualUser">
      <chat-box
        :model-value="dialog"
        :username="currentChatingWith || contextualUsername"
        @update:model-value="v => (dialog = v)"
      />
    </div>

    <v-dialog v-else-if="canAskYukina" v-model="dialog" :width="responseList.length ? 1000 : 500">
      <v-card>
        <v-card-title class="text-h5">
          What do you want to do?
          (<v-icon>mdi-flask</v-icon>
          Experimental)
        </v-card-title>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-alert
                v-if="notUnderstand"
                v-model="notUnderstand"
                type="error"
                closable
              >
                Sorry, I don't understand.
              </v-alert>
              <recursive-comments
                v-if="responseList.length"
                ref="comments"
                :comments="responseList"
                :can-add-comment="false"
                :can-delete-comment="() => false"
                :my-username="userData && userData.username"
              ></recursive-comments>
              <v-text-field
                v-if="!loading"
                ref="command"
                v-model="command"
                prepend-icon="mdi-message-question"
                label="Ask Yukina for Help"
                autofocus
                hide-details
                @keyup.enter="runCommand"
              ></v-text-field>
              <div v-else>
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                Practice like you perform, perform like you practice.
              </div>
            </v-col>
          </v-row>
        </v-container>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="dialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { useDisplay } from 'vuetify'
import { mapState, mapActions } from 'pinia'
import meta from '../common/config'
import utils from '../common/utils'
import { executeCommand, askYukinaForHelp } from '@/custom-command/luis'
import RecursiveComments from './RecursiveComments'
import { ChatBox } from './chat-box'
import { botUserMeta } from '../common/api/user'
import { useRoseliaStore } from '../store'

export default defineComponent({
  name: 'blog-toolbar',
  components: {
    RecursiveComments,
    ChatBox
  },
  props: {
    userData: { type: Object as PropType<any>, default: null },
    route: { type: String, default: '' },
    realTitle: { type: String, default: '' },
    noDrawer: { type: Boolean, default: false },
    shouldHide: { type: Boolean, default: false }
  },
  setup() {
    return { display: useDisplay() }
  },
  data() {
    return {
      drawer: false,
      dialog: false,
      command: '',
      loading: false,
      notUnderstand: false,
      responseList: [] as any[]
    }
  },
  computed: {
    title(): string {
      return this.realTitle || meta.title
    },
    shouldHaveToolbar(): boolean {
      return !this.noDrawer && this.display.smAndDown.value
    },
    canAskYukina(): boolean {
      return meta.enableAskYukina
    },
    contextualUsername(): string {
      if (this.$route.name === 'userTimeline') {
        return (this.$route.params as any).username
      }
      return ''
    },
    canChatWithContextualUser(): boolean {
      return Boolean((this.contextualUsername || this.currentChatingWith) && this.userData)
    },
    ...mapState(useRoseliaStore, ['notifications', 'currentChatingWith']),
    ...mapState(useRoseliaStore, { userMeta: 'currentUser' })
  },
  watch: {
    shouldHaveToolbar(val: boolean) {
      if (!val) this.drawer = false
    },
    currentChatingWith(username: string | undefined) {
      this.dialog = !!username
      if (!this.canChatWithContextualUser) {
        if (username) this.dialog = true
      }
    },
    dialog(val: boolean) {
      if (val) {
        this.$nextTick(() => (this.$refs.command as any)?.focus?.())
        if (!this.currentChatingWith && this.canChatWithContextualUser) {
          this.setChatingWith(this.contextualUsername)
        }
        ;(this.notifications as any[]).forEach(n => this.addDialog({ ...n, content: n.message }))
        this.clearNotifications()
      } else {
        this.setChatingWith(undefined)
      }
    },
    userData() {
      this.responseList = []
    }
  },
  methods: {
    setRedirect() {
      utils.setRedirect(this.route)
    },
    portedLogin(ev: MouseEvent) {
      ev.preventDefault()
      const w = window.open(
        this.$router.resolve({ name: 'login', query: { ported: 'true' } }).href,
        'loginWindow',
        'height=400,width=400,top=0,left=0,toolbar=no,menubar=no,scrollbars=no, resizable=no,location=no, status=no'
      )
      const unwatch = this.$watch('userData', data => {
        if (data) {
          w?.close()
          unwatch()
        }
      })
      w?.addEventListener('close', unwatch as any)
    },
    runCommand() {
      this.loading = true
      executeCommand(this.command).then(understand => {
        this.loading = false
        if (understand) this.dialog = false
        else return Promise.reject('Not understand')
      }).catch(() => this.askYukina())
    },
    askYukina() {
      this.responseList = [...this.responseList, {
        id: Math.round(Math.random() * 233),
        content: this.command,
        replies: [],
        createdAt: new Date(),
        author: (this.userMeta && (this.userMeta as any).username) ? this.userMeta : this.userData,
        nickname: 'New Staff',
        color: 'accent'
      }]
      this.loading = true
      askYukinaForHelp(this.command).then(answer => {
        this.addDialog({ content: answer })
        this.loading = false
        this.command = ''
      }).catch(() => {
        this.loading = false
        this.notUnderstand = true
        this.addDialog({ color: 'error', content: `Sorry, I don't understand.` })
      })
    },
    addDialog(content: any) {
      this.responseList = [...this.responseList, {
        id: Math.round(Math.random() * 233),
        content: content.content,
        replies: [],
        createdAt: content.time ? new Date(content.time) : new Date(),
        author: botUserMeta,
        color: content.color
      }]
    },
    ...mapActions(useRoseliaStore, ['clearNotifications', 'setChatingWith'])
  }
})
</script>
