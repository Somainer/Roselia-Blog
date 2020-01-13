import Vue from 'vue'
import { INotification } from '@/common/api/notifications';

declare module 'vue/types/vue' {
    interface Vue {
        $notify(toast: INotification): void
    }
}