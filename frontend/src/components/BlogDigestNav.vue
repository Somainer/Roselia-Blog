<template>
  <div id="digest-nav" ref="digestNav" class="hide-on-small-only pushpin">
    <ul class="section table-of-contents">
      <li v-for="{hash, title} in items" :key="hash">
        <a :href="'#' + hash" :to="{hash: hash, query: $route.query}">{{title}}</a>
      </li>
    </ul>
  </div>
</template>
<script>
import M from 'materialize-css'
export default {
  name: 'blog-digest-nav',
  data: () => ({
  }),
  props: {
    items: Array
  },
  methods: {
    onCreate () {
      this.$nextTick(_ => this.processDigest())
    },
    processDigest () {
      const elems = document.querySelectorAll('.scrollspy')
      let content = document.getElementById('content')
      this.instance = M.ScrollSpy.init(elems)
      M.Pushpin.init(document.querySelectorAll('.pushpin'), {
        top: content.offsetTop,
        offset: 150,
        bottom: content.offsetHeight + content.offsetTop - this.$refs.digestNav.offsetHeight
      })
      // M.AutoInit()
    },
    getInstance () {
      return M.ScrollSpy.getInstance(this.targetElements)
    }
  },
  computed: {
    targetElements () {
      return this.items.map(x => x.element)
    }
  },
  mounted () {
    this.onCreate()
  },
  destroyed () {
    this.getInstance().destroy()
  },
  watch: {
    items () {
      this.onCreate()
    }
  }
}
</script>
<style src="materialize-css/dist/css/materialize.css" scoped></style>
<style scoped>
  .table-of-contents a:hover {
    border-left: 1px solid var(--theme-color);
  }
  .table-of-contents a.active {
    border-left: 2px solid var(--theme-color);
  }
</style>
