<template>
  <v-container fluid>
    <v-row>
      <div>
        <div>
          <h1>Manage Uploaded Images</h1>
          <v-col cols="12">
            <v-select
              label="Image Upload Channel"
              :loading="loading"
              :items="channels"
              v-model="channel"
              prepend-icon="mdi-camera"
              item-title="text"
              item-value="value"
            ></v-select>
          </v-col>
          <uploaded-images v-model="images" :notify="toast" />
        </div>
      </div>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import UploadedImages from '../UploadedImages.vue'
import { getImageChannels, getUploadedImages, IImageMeta } from '../../common/api/images'

export default defineComponent({
  name: 'uploaded-images-management',
  components: { UploadedImages },
  props: {
    toast: {
      type: Function as PropType<(text: string, type?: string) => void>,
      required: true
    }
  },
  data() {
    return {
      channels: [] as any[],
      loading: false,
      channel: 'roselia',
      images: [] as IImageMeta[]
    }
  },
  watch: {
    channel: {
      handler() { this.loadChannelImages() },
      immediate: true
    }
  },
  mounted() {
    this.loading = true
    getImageChannels().then((channels: any) => {
      this.channels = channels.map((channel: any) => ({
        text: `${channel.name} - ${channel.description}`,
        value: channel.id
      }))
      this.loading = false
    })
  },
  methods: {
    loadChannelImages() {
      this.loading = true
      getUploadedImages(this.channel).then((images: IImageMeta[]) => {
        this.images = images
        this.loading = false
      }).catch((error: any) => {
        this.toast(error, 'error')
        this.loading = false
      })
    }
  }
})
</script>
