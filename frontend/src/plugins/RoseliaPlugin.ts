import * as PluginApi from '@/common/api/plugin-storage'
import Vue, {Component} from 'vue'

interface RoseliaPlugin {
    name: string
    mount(el: Element): void
    beforeMount(): Promise<boolean>
    destroyed(): void
    beforeDestroy(): Promise<boolean>
    api: typeof PluginApi
}

class BaseRoseliaPlugin implements RoseliaPlugin {
    name = ''
    api = PluginApi
    mount(el: Element) {}
    async beforeMount() {
        return true
    }
    mounted() {}
    async beforeDestroy() { return true }
    destroyed() {}
}

export interface IContextPlugin<Context> {
    context: Context
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

    editPage(): Component
    postContent: RoseliaPlugin
}

export abstract class RichPostPlugin extends BaseRoseliaPlugin implements IRichPostPlugin {
    name = 'richPostPlugin'
    async doNothing() {
        return true
    }
    doNothingSync() {}
    emptyComponent() {
        return Vue.extend({
            render: h => h()
        })
    }
    beforeCreatePost = this.doNothing;
    beforeDeletePost = this.doNothing;
    beforeEditPost = this.doNothing;
    postCreated = this.doNothingSync;
    postDeleted = this.doNothingSync;
    postEdited = this.doNothingSync;

    editPage = this.emptyComponent
    postContent = new BaseRoseliaPlugin
}