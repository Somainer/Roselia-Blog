import * as PluginApi from '@/common/api/plugin-storage'
import Vue, {Component} from 'vue'

type SatisfactoryChecker = boolean | string

interface RoseliaPlugin {
    name: string
    mounted?(el: Element): void
    beforeMount?(): Promise<SatisfactoryChecker>
    destroyed?(): void
    beforeDestroy?(): Promise<SatisfactoryChecker>
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
    beforeDeletePost?(postId: number): Promise<SatisfactoryChecker>;
    postDeleted?(postId: number): void;
    beforeCreatePost?(postId: number): Promise<SatisfactoryChecker>;
    postCreated?(postId: number): void;
    beforeEditPost?(postId: number): Promise<SatisfactoryChecker>;
    postEdited?(postId: number): void;

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

export function makeBasePlugin<T extends RoseliaPlugin>(plugin: T & ThisType<T & {
    api: typeof PluginApi
}>): RoseliaPlugin {
    plugin['api'] = PluginApi
    return plugin
}
