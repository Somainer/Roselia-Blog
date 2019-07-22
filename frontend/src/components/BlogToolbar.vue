<template>
<div>
  <v-toolbar
    color="primary"
    scroll-toolbar-off-screen
  >
    <v-toolbar-side-icon dark v-if="shouldHaveToolbar" @click.native="drawer = !drawer"></v-toolbar-side-icon>
    <slot></slot>
    <v-toolbar-title>
      <router-link  class="themed-text no-deco" :to="{name:'index'}">{{title}}</router-link>
    </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-toolbar-items v-if="!shouldHaveToolbar">
      <v-btn dark flat @click="dialog = true">
        <v-icon>question_answer</v-icon>
      </v-btn>
      <v-btn dark flat to="/">Index</v-btn>
      <v-btn dark flat to="/timeline">Timeline</v-btn>
      <v-btn dark flat v-if="userData" to="/userspace">{{userData.nickname}}</v-btn>
      <v-btn dark flat v-else tag="a" @click.native="setRedirect" :to="{name: 'login'}" @contextmenu="portedLogin($event)">Login</v-btn>
    </v-toolbar-items>
  </v-toolbar>
    <v-navigation-drawer
      v-model="drawer"
      fixed
      clipped
      app
      v-if="shouldHaveToolbar"
    >
      <v-toolbar flat>
      <v-list>
        <v-list-tile>
          <v-list-tile-title class="title">
            {{title}}
          </v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-toolbar>
    <v-divider></v-divider>

    <v-list dense class="pt-0">
      <v-list-tile to="/">
        <v-list-tile-action>
          <v-icon>home</v-icon>
        </v-list-tile-action>

        <v-list-tile-content>
          <v-list-tile-title>Index</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
    <v-list dense class="pt-0">
      <v-list-tile to="/timeline">
        <v-list-tile-action>
          <v-icon>list_alt</v-icon>
        </v-list-tile-action>

        <v-list-tile-content>
          <v-list-tile-title>Timeline</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
    <v-list dense class="pt-0" v-if="userData">
      <v-list-tile to="/userspace">
        <v-list-tile-action>
          <v-icon>account_circle</v-icon>
        </v-list-tile-action>

        <v-list-tile-content>
          <v-list-tile-title>{{userData.nickname}}</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
    <v-list dense class="pt-0" v-else>
      <v-list-tile to="/login" @click="setRedirect">
        <v-list-tile-action>
          <v-icon>person</v-icon>
        </v-list-tile-action>

        <v-list-tile-content>
          <v-list-tile-title>Login</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
    <v-list dense class="pt-0">
      
      <v-list-tile @click="dialog = true">
        <v-list-tile-action>
          <v-icon>question_answer</v-icon>
        </v-list-tile-action>

        <v-list-tile-content>
          <v-list-tile-title>Ask Yukina for help</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
    </v-navigation-drawer>
    <v-dialog
      v-model="dialog"
      width="500"
    >
      <v-card>
        <v-card-title
          class="headline"
          primary-title
        >
          What do you want to do?
          (<v-icon>build</v-icon>
          Experimental)
        </v-card-title>
        <v-container grid-list-md>
          <v-layout wrap>
            <v-flex xs12>
              <v-alert
                v-model="notUnderstand"
                type="error"
                transition="scale-transition"
                dismissible
              >
                Sorry, I don't understand.
              </v-alert>
              <v-text-field
                v-if="!loading"
                hide-details
                prepend-icon="question_answer"
                label="Ask Yukina for help"
                single-line
                autofocus
                v-model="command"
                @keyup.enter="runCommand"
              ></v-text-field>

              <div v-else>
                <v-progress-circular indeterminate color="primary"></v-progress-circular> Practice like you perform, perform like you practice.
              </div>
            </v-flex>
          </v-layout>
        </v-container>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            flat
            @click="dialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</div>
</template>

<script>
import meta from '../common/config'
import utils from '../common/utils'
import {executeCommand} from '@/custom-command/luis.ts'
export default {
  name: 'blog-toolbar',
  props: ['userData', 'route', 'realTitle', 'noDrawer'],
  data () {
    return {
      drawer: false,
      dialog: false,
      command: '',
      loading: false,
      notUnderstand: false
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
        this.notUnderstand = !understand
        this.loading = false
        if(understand) this.dialog = false
      }).catch(err => {
        this.loading = false
        this.notUnderstand = true
      })
    }
  },
  computed: {
    title() {
      return this.realTitle || meta.title
    },
    shouldHaveToolbar() {
      return !this.noDrawer && this.$vuetify.breakpoint.smAndDown
    }
  },
  watch: {
    shouldHaveToolbar(val) {
      if(!val) this.drawer = false
    }
  }
}
</script>

<style scoped>
</style>
