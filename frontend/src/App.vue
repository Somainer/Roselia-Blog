<template>
  <div id="black-shout">
    <div v-wechat-title="$route.meta.title"></div>
    <theme-listener v-model="preferedLight"></theme-listener>
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
    </v-app>
    <vue-progress-bar></vue-progress-bar>
    <go-top-btn></go-top-btn>
  </div>

</template>

<script>
import ThemeListener from './plugin/ThemeListener'
import { selectByLuminance } from './common/helpers';
import {userInfoManager} from "./common/UserInfoManager";
export default {
  name: 'App',
  components: {
    'theme-listener': ThemeListener
  },
  mounted () {
    //  [App.vue specific] When App.vue is finish loading finish the progress bar
    this.$Progress.finish()
    this.$watch('$vuetify.theme', theme => {
      document.body.style.setProperty('--theme-color', theme.primary)
      document.body.style.setProperty('--theme-secondary-color', theme.secondary)
      document.body.style.setProperty('--themed-text-color', selectByLuminance(theme.primary, '#000000', '#ffffff', '#ffffff'))
    }, {
      immediate: true,
      deep: true
    })
  },
  created () {
    //  [App.vue specific] When App.vue is first loaded start the progress bar
    // this.$Progress.start()
    // //  hook the progress bar to start before we move router-view
    // this.$router.beforeEach((to, from, next) => {
    //   //  does the page we want to go to have a meta.progress object
    //   if (to.meta.progress !== undefined) {
    //     let meta = to.meta.progress
    //     // parse meta tags
    //     this.$Progress.parseMeta(meta)
    //   }
    //   //  start the progress bar
    //   this.$Progress.start()
    //   //  continue to next page
    //   next()
    // })
    // //  hook the progress bar to finish after we've finished moving router-view
    // this.$router.afterEach((to, from) => {
    //   //  finish the progress bar
    //   this.$Progress.finish()
    // })
    userInfoManager.addChangeListener(d => {
      this.userData = d
    })
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
      preferedLight: undefined,
      userData: userInfoManager.getPayload()
    }
  },
  computed: {
    isNight () {
      let hour = (new Date()).getHours()
      let morning = (hour > 6 && hour < 18)
      return this.forceDark || !(this.forceLight || morning)
    }
  },
  watch: {
    preferedLight(val) {
      if(typeof val !== 'undefined') {
        const isDark = !val
        this.forceLight = !isDark
        this.forceDark = isDark
      } else {
        this.forceLight = this.forceDark = false
      }
    }
  }
}
</script>

<style>
  :root {
    --theme-color: #6670ed;
    --theme-secondary-color: #890f87;
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
  .highlight .hll {
    background-color: #ffffcc
  }

  .highlight .c {
    color: #177500
  }

  /* Comment */
  .highlight .err {
    color: #000000
  }

  /* Error */
  .highlight .k {
    color: #A90D91
  }

  /* Keyword */
  .highlight .l {
    color: #1C01CE
  }

  /* Literal */
  .highlight .n {
    color: #000000
  }

  /* Name */
  .highlight .o {
    color: #000000
  }

  /* Operator */
  .highlight .ch {
    color: #177500
  }

  /* Comment.Hashbang */
  .highlight .cm {
    color: #177500
  }

  /* Comment.Multiline */
  .highlight .cp {
    color: #633820
  }

  /* Comment.Preproc */
  .highlight .cpf {
    color: #177500
  }

  /* Comment.PreprocFile */
  .highlight .c1 {
    color: #177500
  }

  /* Comment.Single */
  .highlight .cs {
    color: #177500
  }

  /* Comment.Special */
  .highlight .kc {
    color: #A90D91
  }

  /* Keyword.Constant */
  .highlight .kd {
    color: #A90D91
  }

  /* Keyword.Declaration */
  .highlight .kn {
    color: #A90D91
  }

  /* Keyword.Namespace */
  .highlight .kp {
    color: #A90D91
  }

  /* Keyword.Pseudo */
  .highlight .kr {
    color: #A90D91
  }

  /* Keyword.Reserved */
  .highlight .kt {
    color: #A90D91
  }

  /* Keyword.Type */
  .highlight .ld {
    color: #1C01CE
  }

  /* Literal.Date */
  .highlight .m {
    color: #1C01CE
  }

  /* Literal.Number */
  .highlight .s {
    color: #C41A16
  }

  /* Literal.String */
  .highlight .na {
    color: #836C28
  }

  /* Name.Attribute */
  .highlight .nb {
    color: #A90D91
  }

  /* Name.Builtin */
  .highlight .nc {
    color: #3F6E75
  }

  /* Name.Class */
  .highlight .no {
    color: #000000
  }

  /* Name.Constant */
  .highlight .nd {
    color: #000000
  }

  /* Name.Decorator */
  .highlight .ni {
    color: #000000
  }

  /* Name.Entity */
  .highlight .ne {
    color: #000000
  }

  /* Name.Exception */
  .highlight .nf {
    color: #000000
  }

  /* Name.Function */
  .highlight .nl {
    color: #000000
  }

  /* Name.Label */
  .highlight .nn {
    color: #000000
  }

  /* Name.Namespace */
  .highlight .nx {
    color: #000000
  }

  /* Name.Other */
  .highlight .py {
    color: #000000
  }

  /* Name.Property */
  .highlight .nt {
    color: #000000
  }

  /* Name.Tag */
  .highlight .nv {
    color: #000000
  }

  /* Name.Variable */
  .highlight .ow {
    color: #000000
  }

  /* Operator.Word */
  .highlight .mb {
    color: #1C01CE
  }

  /* Literal.Number.Bin */
  .highlight .mf {
    color: #1C01CE
  }

  /* Literal.Number.Float */
  .highlight .mh {
    color: #1C01CE
  }

  /* Literal.Number.Hex */
  .highlight .mi {
    color: #1C01CE
  }

  /* Literal.Number.Integer */
  .highlight .mo {
    color: #1C01CE
  }

  /* Literal.Number.Oct */
  .highlight .sa {
    color: #C41A16
  }

  /* Literal.String.Affix */
  .highlight .sb {
    color: #C41A16
  }

  /* Literal.String.Backtick */
  .highlight .sc {
    color: #2300CE
  }

  /* Literal.String.Char */
  .highlight .dl {
    color: #C41A16
  }

  /* Literal.String.Delimiter */
  .highlight .sd {
    color: #C41A16
  }

  /* Literal.String.Doc */
  .highlight .s2 {
    color: #C41A16
  }

  /* Literal.String.Double */
  .highlight .se {
    color: #C41A16
  }

  /* Literal.String.Escape */
  .highlight .sh {
    color: #C41A16
  }

  /* Literal.String.Heredoc */
  .highlight .si {
    color: #C41A16
  }

  /* Literal.String.Interpol */
  .highlight .sx {
    color: #C41A16
  }

  /* Literal.String.Other */
  .highlight .sr {
    color: #C41A16
  }

  /* Literal.String.Regex */
  .highlight .s1 {
    color: #C41A16
  }

  /* Literal.String.Single */
  .highlight .ss {
    color: #C41A16
  }

  /* Literal.String.Symbol */
  .highlight .bp {
    color: #5B269A
  }

  /* Name.Builtin.Pseudo */
  .highlight .fm {
    color: #000000
  }

  /* Name.Function.Magic */
  .highlight .vc {
    color: #000000
  }

  /* Name.Variable.Class */
  .highlight .vg {
    color: #000000
  }

  /* Name.Variable.Global */
  .highlight .vi {
    color: #000000
  }

  /* Name.Variable.Instance */
  .highlight .vm {
    color: #000000
  }

  /* Name.Variable.Magic */
  .highlight .il {
    color: #1C01CE
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
  /* Literal.Number.Integer.Long */

</style>
