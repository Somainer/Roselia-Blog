import {makeApi} from './protocol'

type IBasePluginStorageInfo = {
    application: string,
    key: string
}

interface IContent {
    content: string
}

interface ISearchRecord {
    application: string,
    index: string,
    all: boolean
}

interface IBaseStorageContent extends IBasePluginStorageInfo {
    content: string,
    created: Date,
    edited: Date,
    index: string,
    user: number
}

interface IGetAll {
    all: boolean
}

export const getContent = (request: IBasePluginStorageInfo & {
    forMe: boolean
}) => makeApi<IBasePluginStorageInfo, IBaseStorageContent>('get', 'plugin-storage/get-content', request.forMe)(request)


export const newRecord = makeApi<IBasePluginStorageInfo & IContent & IGetAll>('post', 'plugin-storage/new-record')

export const searchRecords = makeApi<ISearchRecord, IBaseStorageContent[]>('get', 'plugin-storage/search-records')

export const editRecord = makeApi<IBasePluginStorageInfo & IContent & IGetAll>('post', 'plugin-storage/edit-record')

export const deleteRecord = makeApi<IBasePluginStorageInfo & IGetAll>('post', 'plugin-storage/delete-record')

export const upsertRecord = makeApi<IBasePluginStorageInfo>('post', 'plugin-storage/upsert-record')

export const deleteByIndex = makeApi<ISearchRecord>('post', 'plugin-storage/delete-by-index')

export const removeApplication = makeApi<{application: string}>('post', 'plugin-storage/remove-application')
