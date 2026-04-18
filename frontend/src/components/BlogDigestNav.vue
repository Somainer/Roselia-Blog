<template>
  <div id="digest-nav" ref="digestNav" class="hide-on-small-only table-of-contents">
    <ul class="section">
      <li v-for="{hash, title} in items" :key="hash">
        <a :href="'#' + hash">{{ title }}</a>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

interface DigestItem {
  hash: string
  title: string
  element?: Element
}

export default defineComponent({
  name: 'blog-digest-nav',
  props: {
    items: { type: Array as PropType<DigestItem[]>, default: () => [] }
  }
})
</script>

<style scoped>
.table-of-contents {
  position: sticky;
  top: 80px;
  padding: 16px;
  list-style: none;
}
.table-of-contents ul {
  padding: 0;
  margin: 0;
  list-style: none;
}
.table-of-contents li a {
  display: block;
  padding: 4px 8px;
  color: inherit;
  text-decoration: none;
  border-left: 1px solid transparent;
}
.table-of-contents a:hover {
  border-left: 1px solid var(--theme-color);
}
.table-of-contents a.active {
  border-left: 2px solid var(--theme-color);
}
</style>
