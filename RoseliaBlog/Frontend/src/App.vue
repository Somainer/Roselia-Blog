<template>
  <div id="black-shout">
    <div v-wechat-title="$route.meta.title"></div>
    <theme-listener v-model="preferredLight"></theme-listener>
    <v-app :dark="isNight">
      <v-content>
        <v-slide-x-transition hide-on-leave>
          <router-view
            @forceSwitchToLight="switchToLight"
            @forceSwitchToDark="switchToDark"
            :currentColorScheme="!isNight"
            :userData="userData"
          ></router-view>
        </v-slide-x-transition>

      </v-content>
      <go-top-btn></go-top-btn>
      <notification-hub/>
    </v-app>
    <vue-progress-bar></vue-progress-bar>
  </div>

</template>

<script>
import Vue from 'vue'
import ThemeListener from './plugin/ThemeListener'
import { selectByLuminance } from './common/helpers';
import {userInfoManager} from "./common/UserInfoManager";
import wsBus from './plugins/ws-bus'
import NotificationHub from './components/NotificationHub'
import '@/code-highlight.css'
// import '@/highlight-vs.css'

export default Vue.extend({
  name: 'App',
  components: {
    'theme-listener': ThemeListener,
    NotificationHub
  },
  mounted () {
    //  [App.vue specific] When App.vue is finish loading finish the progress bar
    this.$Progress.finish()
    this.$watch('$vuetify.theme.currentTheme', theme => {
      document.body.style.setProperty('--themed-text-color', selectByLuminance(theme.primary, '#000000', '#ffffff', '#ffffff'))
    }, {
      immediate: true,
      deep: true
    })
  },
  created () {
    // [App.vue specific] When App.vue is first loaded start the progress bar
    this.$Progress.start()
    //  hook the progress bar to start before we move router-view
    this.$router.beforeEach((to, from, next) => {
      //  does the page we want to go to have a meta.progress object
      if (to.meta.progress !== undefined) {
        const meta = to.meta.progress
        // parse meta tags
        this.$Progress.parseMeta(meta)
      }
      //  start the progress bar
      this.$Progress.start()
      //  continue to next page
      next()
    })
    //  hook the progress bar to finish after we've finished moving router-view
    this.$router.afterEach((to, from) => {
      //  finish the progress bar
      this.$Progress.finish()
    })
    userInfoManager.addChangeListener(d => {
      this.userData = d
      this.$store.commit('setUserData', d)
      if (d) {
        this.$store.dispatch('ensureUserMeta')
      }
    }, true)
  },
  methods: {
    switchToLight(ev) {
      this.forceLight = !!ev
    },
    switchToDark(ev) {
      this.forceDark = !!ev
    }
  },
  data(){
    return {
      forceLight: false,
      forceDark: false,
      forceTitle: '',
      preferredLight: undefined,
      userData: userInfoManager.getPayload()
    }
  },
  computed: {
    isNight () {
      if (this.forceDark || this.forceLight) {
        return this.forceDark || !this.forceLight
      }

      if (typeof this.preferredLight !== 'undefined') {
        return !this.preferredLight;
      }

      const hour = (new Date()).getHours()
      const morning = (hour > 6 && hour < 18)
      return morning
    }
  },
  watch: {
    isNight: {
      handler(dark) {
        this.$vuetify.theme.dark = !!dark
      },
      immediate: true
    }
  }
})
</script>

<style>
  :root {
    --theme-color: var(--v-primary-base);
    --theme-secondary-color: var(--v-secondary-base);
    --themed-text-color: #ffffff;
    /* --theme-color: #0288d1; */
  }

  .themed-text {
    color: var(--themed-text-color) !important;
  }

  code, pre {
    font-family: Menlo, Consolas, "Courier New", monospace;
  }

  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  body {
    font-family: Seravek, 'JAF Bernino Sans', 'Myriad Pro', Myriad, 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  ::selection {
    background: var(--theme-color);
    color: #fff;
    color: var(--themed-text-color);
  }

  .table-of-contents a.active {
    border-left: 2px solid var(--theme-color);
  }

  .table-of-contents a:hover {
    border-left: 1px solid var(--theme-color);
  }

  blockquote {
    border-left: 5px solid var(--theme-color);
  }

  span.heimu {
    background: black;
    color: black;
    transition: background 0.37s ease;
  }

  span.heimu:hover {
    color: inherit;
    background: inherit;
  }

  span.heimu a:link {
    background: black;
    color: black !important;
  }

  span.heimu a:visited {
    background: black;
    color: black !important;
  }

  span.heimu a:hover {
    background: black;
    color: black !important;
  }

  span.heimu a:active {
    background: black;
    color: black !important;
  }

  
  #materialbox-overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: #292929 !important;
    z-index: 1000;
    will-change: opacity;
  }

  div.highlight {
    background-color: #f5f5f5;
    color: #bd4147;
    box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
    font-size: 85%;
    font-weight: 900;
  }

  .flow-text {
    font-weight: 300;
  }

  @media only screen and (min-width: 360px) {
    .flow-text {
      font-size: 1.2rem;
    }
  }

  @media only screen and (min-width: 390px) {
    .flow-text {
      font-size: 1.224rem;
    }
  }

  @media only screen and (min-width: 420px) {
    .flow-text {
      font-size: 1.248rem;
    }
  }

  @media only screen and (min-width: 450px) {
    .flow-text {
      font-size: 1.272rem;
    }
  }

  @media only screen and (min-width: 480px) {
    .flow-text {
      font-size: 1.296rem;
    }
  }

  @media only screen and (min-width: 510px) {
    .flow-text {
      font-size: 1.32rem;
    }
  }

  @media only screen and (min-width: 540px) {
    .flow-text {
      font-size: 1.344rem;
    }
  }

  @media only screen and (min-width: 570px) {
    .flow-text {
      font-size: 1.368rem;
    }
  }

  @media only screen and (min-width: 600px) {
    .flow-text {
      font-size: 1.392rem;
    }
  }

  @media only screen and (min-width: 630px) {
    .flow-text {
      font-size: 1.416rem;
    }
  }

  @media only screen and (min-width: 660px) {
    .flow-text {
      font-size: 1.44rem;
    }
  }

  @media only screen and (min-width: 690px) {
    .flow-text {
      font-size: 1.464rem;
    }
  }

  @media only screen and (min-width: 720px) {
    .flow-text {
      font-size: 1.488rem;
    }
  }

  @media only screen and (min-width: 750px) {
    .flow-text {
      font-size: 1.512rem;
    }
  }

  @media only screen and (min-width: 780px) {
    .flow-text {
      font-size: 1.536rem;
    }
  }

  @media only screen and (min-width: 810px) {
    .flow-text {
      font-size: 1.56rem;
    }
  }

  @media only screen and (min-width: 840px) {
    .flow-text {
      font-size: 1.584rem;
    }
  }

  @media only screen and (min-width: 870px) {
    .flow-text {
      font-size: 1.608rem;
    }
  }

  @media only screen and (min-width: 900px) {
    .flow-text {
      font-size: 1.632rem;
    }
  }

  @media only screen and (min-width: 930px) {
    .flow-text {
      font-size: 1.656rem;
    }
  }

  @media only screen and (min-width: 960px) {
    .flow-text {
      font-size: 1.68rem;
    }
  }

  @media only screen and (max-width: 360px) {
    .flow-text {
      font-size: 1.2rem;
    }
  }
  img.responsive-img,
  video.responsive-video {
    max-width: 100%;
    height: auto;
  }
  .no-deco {
    text-decoration: none;
  }
</style>
