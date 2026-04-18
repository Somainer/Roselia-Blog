import * as PluginApi from '@/common/api/plugin-storage'
import { createApp, defineComponent, h, type App, type Component } from 'vue'

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
    private _app?: App
    abstract getInstance(): Component
    mount(el: Element) {
        this._app = createApp(this.getInstance())
        this._app.mount(el as any)
    }
    destroyed() {
        this._app?.unmount()
        this._app = undefined
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
    emptyComponent(): Component {
        return defineComponent({
            render: () => h('div')
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
    (plugin as any)['api'] = PluginApi
    return plugin
}
