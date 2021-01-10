import type { VNode } from 'vue'
import { IImageMeta } from './api/images';
import { RoseliaStorage } from './RoseliaStorage';

export interface IRoseliaPost {
    id: number
    displayId: string
    title: string
    subtitle: string
    img: string[]
    catalogs: string[]
    content: string
    created: string
    lastEdit: string
    author: IRoseliaUserMeta
    hidden: boolean
    secret: number
    enableComment: boolean
}

export interface IRoseliaUserMeta {
    id: number
    avatar?: string
    banner?: string
    mail?: string
    nickname: string
    motto?: string
    role: number
    username: string
}

export interface IPostDraft {
    data: IRoseliaPost
    markdown: true
    uploadImages: IImageMeta
}

export interface IRoseliaPostComment {
    id: number
    content: string | VNode
    replies: IRoseliaPostComment[]
    createdAt: Date
    color?: string
    replyTo?: number
    author?: IRoseliaUserMeta
    nickname?: string
}

export const keyForDraft = (postId: number) => `postDraft#${postId}`

export const getStorageForDraft = (postId: number) => new RoseliaStorage<IPostDraft>(keyForDraft(postId));

export const importAndRenderMarkdown = (() => {
    let promise: Promise<(s: string) => string> | undefined

    return (markdown: string) => {
        promise = promise || import(/* webpackChunkName: "fire-bird" */ '@/common/roselia-markdown').then(({markdown}) => markdown)
        return promise.then(fn => fn(markdown))
    }
})()
