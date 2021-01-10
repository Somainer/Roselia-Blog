
import type { IUploadedImageMeta } from '@/common/api/images'

export interface IRoseliaEditPageFullActionBus {
    save(shouldLeave: boolean): void
    saveDraft(): void
    goToPreview(): void
    goToLivePreview(): void
    uploadImage(image: File, objectUrl: string): Promise<IUploadedImageMeta['result']>
}

export type IRoseliaEditPageActionBus = Partial<IRoseliaEditPageFullActionBus>

export const imageSourceForUrl = (useMarkdown: boolean, url: string, alt: string = '') => {
    if (useMarkdown) {
        return `![${alt}](${url})`
    }

    return `<img src="${url}" alt="${alt}">`
}
