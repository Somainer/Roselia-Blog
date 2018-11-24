import Dialog from '../../components/CustomDialog.vue'
import Vue from 'vue'

export const summonDialog = (props, mount) => {
    return new Vue({
        render: h => h(
            Dialog,
            {
                props
            }
        )
    }).$mount(mount)
}