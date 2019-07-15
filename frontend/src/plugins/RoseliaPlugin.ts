import * as PluginApi from '@/common/api/plugin-storage'
import Vue, {Component} from 'vue'

abstract class BaseRoseliaPlugin {
    api = PluginApi
    abstract mount(el: Element): void
    async beforeMount() {
        return true
    }
    mounted() {}
    async beforeDestroy() { return true }
    destroyed() {}
}

export abstract class StaticRoseliaPlugin extends BaseRoseliaPlugin {
    abstract getContent(): string
    mount(el: Element) {
        el.innerHTML = this.getContent()
    }
}

export abstract class VueRoseliaPlugin extends BaseRoseliaPlugin {
    abstract getInstance(): Vue
    mount(el: Element) {
        this.getInstance().$mount(el)
    }
}

type IRichPostPlugin = {
    beforeDeletePost(postId: number): Promise<boolean>;
    postDeleted(postId: number): void;
    beforeCreatePost(postId: number): Promise<boolean>;
    postCreated(postId: number): void;
    beforeEditPost(postId: number): Promise<boolean>;
    postEdited(postId: number): void;
}

export abstract class RichPostPlugin extends BaseRoseliaPlugin implements IRichPostPlugin {
    async doNothing() {
        return true
    }
    doNothingSync() {}
    beforeCreatePost = this.doNothing;
    beforeDeletePost = this.doNothing;
    beforeEditPost = this.doNothing;
    postCreated = this.doNothingSync;
    postDeleted = this.doNothingSync;
    postEdited = this.doNothingSync;
}