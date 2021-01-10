import type { Vuetify } from 'vuetify/types'

// declare module 'vuetify/lib' {
//     import 'vuetify/types/lib'
// }


declare module "vue/types/options" {
    interface ComponentOptions<V extends Vue> {
        vuetify?: Vuetify;
    }
}
