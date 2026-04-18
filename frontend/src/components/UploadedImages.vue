<template>
  <v-row>
    <v-col v-for="(image, i) in images" :key="i" :cols="3">
      <v-card :loading="imagesAreLoading.includes(image)" :disabled="imagesAreLoading.includes(image)">
        <v-img :src="image.url">
          <v-card-title>
            <v-chip>{{ image.channel }}</v-chip>
          </v-card-title>
        </v-img>
        <v-card-actions>
          <span class="text-truncate">{{ image.fileName }}</span>
          <v-btn
            v-if="deletionFailures.includes(image)"
            color="error"
            size="x-small"
            icon="mdi-close"
            @click="removeImage(image)"
          ></v-btn>
          <v-spacer></v-spacer>
          <v-btn
            v-if="image.deleteKey"
            color="error"
            icon="mdi-delete"
            @click="requestRemoveImage(image)"
          ></v-btn>
          <v-btn icon="mdi-share" :href="image.url"></v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { IImageMeta, removeImage } from '../common/api/images'

export default defineComponent({
  name: 'uploaded-images',
  props: {
    modelValue: {
      type: Array as PropType<IImageMeta[]>,
      default: () => []
    },
    notify: {
      type: Function as PropType<(content: string, type?: string) => void>,
      required: false
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      imagesAreLoading: [] as IImageMeta[],
      deletionFailures: [] as IImageMeta[]
    }
  },
  computed: {
    images(): IImageMeta[] {
      return this.modelValue || []
    }
  },
  watch: {
    images: {
      handler(images: IImageMeta[]) {
        const loadings = images.filter((x: any) => x.loading)
        if (loadings.length) this.imagesAreLoading = this.imagesAreLoading.concat(loadings)
      },
      immediate: true
    }
  },
  methods: {
    alterImageTo(newImage: IImageMeta[]) {
      this.$emit('update:modelValue', newImage)
    },
    removeImage(image: IImageMeta) {
      this.alterImageTo(this.images.filter(x => x !== image))
    },
    async requestRemoveImage(image: IImageMeta) {
      if (!image.deleteKey) return
      this.imagesAreLoading = this.imagesAreLoading.concat(image)
      try {
        await removeImage(image.deleteKey, image.channel)
        this.removeImage(image)
        this.sendNotify(`Image ${image.fileName} deleted.`, 'success')
      } catch (error) {
        this.imagesAreLoading = this.imagesAreLoading.filter(x => x !== image)
        this.deletionFailures = this.deletionFailures.concat(image)
        this.sendNotify(String(error), 'error')
      }
    },
    sendNotify(content: string, type: string) {
      this.notify && this.notify(content, type)
    }
  }
})
</script>
