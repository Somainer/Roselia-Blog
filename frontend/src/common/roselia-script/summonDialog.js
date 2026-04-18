import { createApp, h } from 'vue'
import Dialog from '../../components/CustomDialog.vue'

export const summonDialog = (props, mount) => {
  const app = createApp({
    render: () => h(Dialog, {
      ...props,
      cleanUp: () => {
        try { props.cleanUp && props.cleanUp() } finally { app.unmount() }
      }
    })
  })
  app.mount(mount)
  return app
}
