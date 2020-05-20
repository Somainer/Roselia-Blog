import { makeApi } from './protocol'
import utils from '../utils';
import request from '../ajax-bar-axios'

interface IImageAPIMeta {
    id: string
    name: string
    description: string
}

export interface IImageMeta {
    url: string
    channel: string
    fileName: string
    deleteKey?: string
}

interface IUploadedImageMeta {
    success: boolean
    picUrl: string
    msg: string
    result: {
        url: string
        channel: string
        deleteKey: string
    }
}

const defaultChannel = 'roselia'

export const getImageChannels: () => Promise<IImageAPIMeta[]> = (() => {
    let cache: Promise<IImageAPIMeta[]> | undefined = undefined
    return () => {
        if (!cache) {
            cache = utils.fetchJSONWithSuccess(utils.apiFor('pic', 'channels')) as Promise<IImageAPIMeta[]>
        }

        return cache;
    }
})();

export const getUploadedImages = async (channel: string = defaultChannel): Promise<IImageMeta[]> => {
    return makeApi<{}, IImageMeta[]>('get', `pic/${channel}/list`)({})
}

export const uploadImage = async (imageData: File, channel: string = defaultChannel, convert?: string) => {
    const form = new FormData()
    if (convert) form.append('to', convert)
    form.append('file', imageData)
    form.append('token', utils.getLoginData().token)
    return await request.post(utils.apiFor('pic', channel, 'upload'), form, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }).then(x => x.data) as IUploadedImageMeta
}

export const removeImage = (fileName: string, channel: string = defaultChannel) => {
    return makeApi('post', `pic/${channel}/remove`)({
        fileName
    })
}
