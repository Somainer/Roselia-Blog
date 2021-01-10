<template>
  <v-row>
    <v-col
      v-for="(image, i) in images"
      :key="i"
      :cols="3"
    >
      <v-card :loading="imagesAreLoading.includes(image)" :disabled="imagesAreLoading.includes(image)">
        <v-img
          :src="image.url"
        >
          <v-card-title>
            <v-chip>{{ image.channel }}</v-chip>
          </v-card-title>
        </v-img>

        <v-card-actions>
          <span class="text-truncate">{{ image.fileName }}</span>
          <v-btn color="error" x-small fab @click="removeImage(image)" v-if="deletionFailures.includes(image)">
            <v-icon>clear</v-icon>
          </v-btn>
          <v-spacer></v-spacer>

          <v-btn color="error" icon v-if="image.deleteKey" @click="requestRemoveImage(image)">
            <v-icon>delete</v-icon>
          </v-btn>

          <v-btn icon :href="image.url">
            <v-icon>share</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";

import { IImageMeta, removeImage } from '../common/api/images'

export default Vue.extend({
  props: {
    images: {
      type: Array as PropType<IImageMeta[]>
    },
    notify: {
      type: Function as PropType<(content: string, type?: string) => void>,
      required: false
    }
  },
  model: {
    prop: 'images',
    event: 'change-image'
  },
  data() {
    return {
      imagesAreLoading: [] as IImageMeta[],
      deletionFailures: [] as IImageMeta[],
    }
  },
  methods: {
    alterImageTo(newImage: IImageMeta[]) {
      this.$emit('change-image', newImage)
    },
    removeImage(image: IImageMeta) {
      this.alterImageTo(this.images.filter(x => x !== image))
    },
    async requestRemoveImage(image: IImageMeta) {
      if (!image.deleteKey) return;
      this.imagesAreLoading = this.imagesAreLoading.concat(image)
      try {
        await removeImage(image.deleteKey, image.channel)
        this.removeImage(image)
        this.sendNotify(`Image ${image.fileName} deleted.`, 'success')
      } catch (error) {
        this.imagesAreLoading = this.imagesAreLoading.filter(x => x !== image)
        this.deletionFailures = this.deletionFailures.concat(image)
        this.sendNotify(error, 'error')
      }
    },
    sendNotify(content: string, type: string) {
      this.notify && this.notify(content, type)
    }
  },
  watch: {
    images: {
      handler(images) {
        const loadings = images.filter(x => x.loading) as IImageMeta[]
        if (loadings.length) {
          this.imagesAreLoading = this.imagesAreLoading.concat(loadings)
        }
      },
      immediate: true
    }
  }
})
</script>
