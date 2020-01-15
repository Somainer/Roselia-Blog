<template>
<div>
  <v-app-bar
    color="primary"
    scroll-off-screen
    v-if="!shouldHide"
  >
    <v-app-bar-nav-icon dark v-if="shouldHaveToolbar" @click.native="drawer = !drawer"></v-app-bar-nav-icon>
    <slot></slot>
    <v-toolbar-title>
      <router-link  class="themed-text no-deco" :to="{name:'index'}">{{title}}</router-link>
    </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-toolbar-items v-if="!shouldHaveToolbar">
      <v-btn dark text @click="dialog = true" v-if="canAskYukina">
        <v-badge dot color="secondary">
          <span slot="badge" v-if="notifications.length">{{ notifications.length }}</span>
          <v-icon>question_answer</v-icon>
        </v-badge>
      </v-btn>
      <v-btn dark text to="/">Index</v-btn>
      <v-btn dark text to="/timeline">Timeline</v-btn>
      <v-btn dark text v-if="userData" to="/userspace">{{userData.nickname}}</v-btn>
      <v-btn dark text v-else tag="a" @click.native="setRedirect" :to="{name: 'login'}"
             @contextmenu="portedLogin($event)">Login
      </v-btn>
    </v-toolbar-items>
  </v-app-bar>
  <v-navigation-drawer
    v-model="drawer"
    fixed
    clipped
    app
    v-if="shouldHaveToolbar && !shouldHide"
  >
    <v-toolbar flat>
    <v-list>
      <v-list-item>
        <v-list-item-title class="title">
          {{title}}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-toolbar>
  <v-divider></v-divider>

  <v-list dense class="pt-0">
    <v-list-item to="/">
      <v-list-item-action>
        <v-icon>home</v-icon>
      </v-list-item-action>

      <v-list-item-content>
        <v-list-item-title>Index</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
  </v-list>
  <v-list dense class="pt-0">
    <v-list-item to="/timeline">
      <v-list-item-action>
        <v-icon>list_alt</v-icon>
      </v-list-item-action>

      <v-list-item-content>
        <v-list-item-title>Timeline</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
  </v-list>
  <v-list dense class="pt-0" v-if="userData">
    <v-list-item to="/userspace">
      <v-list-item-action>
        <v-icon>account_circle</v-icon>
      </v-list-item-action>

      <v-list-item-content>
        <v-list-item-title>{{userData.nickname}}</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
  </v-list>
  <v-list dense class="pt-0" v-else>
    <v-list-item to="/login" @click="setRedirect">
      <v-list-item-action>
        <v-icon>person</v-icon>
      </v-list-item-action>

      <v-list-item-content>
        <v-list-item-title>Login</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
  </v-list>
  <v-list dense class="pt-0" v-if="canAskYukina">
    
    <v-list-item @click="dialog = true">
      <v-list-item-action>
        <v-icon>question_answer</v-icon>
      </v-list-item-action>

      <v-list-item-content>
        <v-list-item-title>Ask Yukina for Help</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
  </v-list>
  </v-navigation-drawer>
    <v-dialog
      v-model="dialog"
      :width="responseList.length ? 1000 :500"
      v-if="canAskYukina"
    >
      <v-card>
        <v-card-title
          class="headline"
          primary-title
        >
          What do you want to do?
          (<v-icon>fa-flask</v-icon>
          Experimental)
        </v-card-title>
        <v-container grid-list-md>
          <v-row wrap>
            <v-col cols="12">
              <v-alert
                v-model="notUnderstand"
                type="error"
                transition="scale-transition"
                dismissible
              >
                Sorry, I don't understand.
              </v-alert>
              <recursive-comments ref="comments"
                v-if="responseList.length"
                :comments="responseList" 
                :canAddComment="false"
                :canDeleteComment="() => false"
                :myUsername="userData && userData.username"
              ></recursive-comments>
              <v-text-field
                v-if="!loading"
                hide-details
                prepend-icon="question_answer"
                label="Ask Yukina for Help"
                single-line
                autofocus
                v-model="command"
                @keyup.enter="runCommand"
                ref="command"
              ></v-text-field>

              <div v-else>
                <v-progress-circular indeterminate color="primary"></v-progress-circular> Practice like you perform, perform like you practice.
              </div>
            </v-col>
          </v-row>
        </v-container>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
                  color="primary"
                  text
                  @click="dialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <GlobalEvents v-if="canAskYukina" @keyup.ctrl.89="dialog = !dialog" @keyup.esc="dialog = false"/>
</div>
</template>

<script>
import Vue from 'vue'
import { mapState, mapMutations } from 'vuex'
import meta from '../common/config'
import utils from '../common/utils'
import {executeCommand, askYukinaForHelp} from '@/custom-command/luis.ts'
import {mapToCamelCase} from '../common/helpers'
import GlobalEvents from 'vue-global-events'
import RecursiveComments from './RecursiveComments'

export default {
  name: 'blog-toolbar',
  components: {
    GlobalEvents,
    RecursiveComments
  },
  props: ['userData', 'route', 'realTitle', 'noDrawer', 'shouldHide'],
  data () {
    return {
      drawer: false,
      dialog: false,
      command: '',
      loading: false,
      notUnderstand: false,
      responseList: [],
      userMeta: {}
    }
  },
  methods: {
    setRedirect () {
      utils.setRedirect(this.route)
    },
    portedLogin (ev) {
      ev.preventDefault()
      let w = window.open(this.$router.resolve({
        name: 'login',
        query: {
          ported: true
        }
      }).href, 'loginWindow', 'height=400,width=400,top=0,left=0,toolbar=no,menubar=no,scrollbars=no, resizable=no,location=no, status=no')
      let unwatch = this.$watch('userData', (data) => {
        if (data) {
          w.close()
          unwatch()
        }
      })
      w.addEventListener('close', unwatch)
    },
    runCommand() {
      this.loading = true
      executeCommand(this.command).then(understand => {
        // this.notUnderstand = !understand
        this.loading = false
        if(understand) this.dialog = false
        else return Promise.reject('Not understand')
      }).catch(this.askYukina)
    },
    askYukina() {
      this.responseList = [...this.responseList, {
        id: Math.round(Math.random() * 233),
        content: this.command,
        replies: [],
        createdAt: (new Date).toLocaleTimeString(),
        author: this.userMeta.username ? this.userMeta : this.userData,
        nickname: 'New Staff',
        color: 'accent'
      }]
      this.loading = true
      askYukinaForHelp(this.command).then(answer => {
        this.addDialog(answer)
        this.loading = false
        this.command = ''
      }).catch(err => {
        this.loading = false
        this.notUnderstand = true
      })
    },
    addDialog(content) {
      this.responseList = [...this.responseList, {
          id: Math.round(Math.random() * 233),
          content: content.content,
          replies: [],
          createdAt: (content.time ? new Date(content.time) : new Date).toLocaleTimeString(),
          author: {
            nickname: 'Yukina (Bot)',
            avatar: 'https://img.lisa.moe/images/2019/04/15/GQ6GLDt_.jpg'
          },
          color: content.color
        }]
    },
    ...mapMutations(['clearNotifications'])
  },
  computed: {
    title() {
      return this.realTitle || meta.title
    },
    shouldHaveToolbar() {
      return !this.noDrawer && this.$vuetify.breakpoint.smAndDown
    },
    canAskYukina() {
      return meta.enableAskYukina
    },
    ...mapState(['notifications'])
  },
  watch: {
    shouldHaveToolbar(val) {
      if(!val) this.drawer = false
    },
    dialog(val) {
      if(val) {
        this.$nextTick(() => this.$refs.command.focus())
        if(!this.userMeta.username) {
           utils.fetchJSONWithSuccess(utils.apiFor('user', 'user-meta'), 'GET', {
              username: this.userData.username
            }).then(data => {
              this.userMeta = mapToCamelCase(data)
            })
        }
        this.notifications.forEach(n => {
          this.addDialog({
            ...n,
            content: n.message
          })
        })
        this.clearNotifications()
      }
    },
    userData() {
      this.userMeta = {}
      this.responseList = []
    }
  }
}
</script>

<style scoped>
</style>
