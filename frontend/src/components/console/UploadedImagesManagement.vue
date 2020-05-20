<template>
<v-container fluid>
  <v-row wrap>
    <div>
      <div>
        <h1>Manage Uploaded Images</h1>
        <v-col md="12" lg="12">
          <v-select
              label="Image Upload Channel"
              :loading="loading"
              :items="channels"
              v-model="channel"
              prepend-icon="camera_roll"
            ></v-select>
        </v-col>
        <uploaded-images v-model="images" :notify="toast" />
      </div>
    </div>
  </v-row>
  <v-row>
  </v-row>
</v-container>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'

import UploadedImages from '../UploadedImages.vue'
import { getImageChannels, getUploadedImages, IImageMeta } from '../../common/api/images'

export default Vue.extend({
  components: { UploadedImages },
  props: {
    toast: {
      type: Function as PropType<(text: string, type: string) => void>
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
      handler(channel) {
        this.loadChannelImages()
      },
      immediate: true
    }
  },
  methods: {
    loadChannelImages() {
      this.loading = true
      getUploadedImages(this.channel).then(images => {
        this.images = images
        this.loading = false
      }).catch(error => {
        this.toast(error, 'error')
        this.loading = false
      })
    }
  },
  mounted() {
    this.loading = true
    getImageChannels().then(channels => {
      this.channels = channels.map(channel => ({
        text: `${channel.name} - ${channel.description}`,
        value: channel.id
      }))
      this.loading = false
    })
  }
})
</script>
