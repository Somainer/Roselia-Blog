<template>
  <div id="black-shout">
    <div v-page-title="($route.meta && $route.meta.title) || ''"></div>
    <theme-listener v-model="preferredLight"></theme-listener>
    <v-app :theme="isNight ? 'dark' : 'light'">
      <v-main>
        <v-slide-x-transition hide-on-leave>
          <router-view
            v-slot="{ Component }"
            @force-switch-to-light="switchToLight"
            @force-switch-to-dark="switchToDark"
            :current-color-scheme="!isNight"
            :user-data="userData"
          >
            <component :is="Component" />
          </router-view>
        </v-slide-x-transition>
      </v-main>
      <go-top-btn></go-top-btn>
      <notification-hub/>
    </v-app>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch } from 'vue'
import { useTheme } from 'vuetify'
import ThemeListener from './plugin/ThemeListener'
import { selectByLuminance } from './common/helpers'
import { userInfoManager } from './common/UserInfoManager'
import { useRoseliaStore } from './store'
import NotificationHub from './components/NotificationHub'
import '@/code-highlight.css'

export default defineComponent({
  name: 'App',
  components: {
    'theme-listener': ThemeListener,
    NotificationHub
  },
  setup() {
    const theme = useTheme()
    const store = useRoseliaStore()
    watch(
      () => theme.current.value.colors.primary,
      primary => {
        if (!primary) return
        document.body.style.setProperty(
          '--themed-text-color',
          selectByLuminance(primary, '#000000', '#ffffff', '#ffffff') as string
        )
      },
      { immediate: true }
    )
    return { store }
  },
  data() {
    return {
      forceLight: false,
      forceDark: false,
      forceTitle: '',
      preferredLight: undefined as boolean | undefined,
      userData: userInfoManager.getPayload()
    }
  },
  computed: {
    isNight(): boolean {
      if (this.forceDark || this.forceLight) {
        return this.forceDark || !this.forceLight
      }
      if (typeof this.preferredLight !== 'undefined') {
        return !this.preferredLight
      }
      const hour = new Date().getHours()
      const morning = hour > 6 && hour < 18
      return !morning
    }
  },
  mounted() {
    this.$Progress.finish()
  },
  created() {
    this.$Progress.start()
    this.$router.beforeEach((to, _from, next) => {
      if (to.meta && (to.meta as any).progress !== undefined) {
        this.$Progress.parseMeta((to.meta as any).progress)
      }
      this.$Progress.start()
      next()
    })
    this.$router.afterEach(() => {
      this.$Progress.finish()
    })
    userInfoManager.addChangeListener(d => {
      this.userData = d
      this.store.setUserData(d)
      if (d) this.store.ensureUserMeta()
    }, true)
  },
  methods: {
    switchToLight(ev: boolean) {
      this.forceLight = !!ev
    },
    switchToDark(ev: boolean) {
      this.forceDark = !!ev
    }
  }
})
</script>

<style>
  :root {
    --theme-color: rgb(var(--v-theme-primary));
    --theme-secondary-color: rgb(var(--v-theme-secondary));
    --themed-text-color: #ffffff;
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

  span.heimu a:link,
  span.heimu a:visited,
  span.heimu a:hover,
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
    font-size: 1.2rem;
  }

  @media only screen and (min-width: 480px) { .flow-text { font-size: 1.296rem; } }
  @media only screen and (min-width: 600px) { .flow-text { font-size: 1.392rem; } }
  @media only screen and (min-width: 720px) { .flow-text { font-size: 1.488rem; } }
  @media only screen and (min-width: 840px) { .flow-text { font-size: 1.584rem; } }
  @media only screen and (min-width: 960px) { .flow-text { font-size: 1.68rem; } }

  img.responsive-img,
  video.responsive-video {
    max-width: 100%;
    height: auto;
  }
  .no-deco {
    text-decoration: none;
  }
</style>
