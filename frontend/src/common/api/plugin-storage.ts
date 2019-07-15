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

type IBaseStorageContent = IBasePluginStorageInfo & {
    content: string,
    created: Date,
    edited: Date,
    index: string,
    user: number
}

export const getContent = (request: IBasePluginStorageInfo & {
    forMe: boolean
}) => makeApi<IBasePluginStorageInfo, IBaseStorageContent>('get', 'plugin-storage/get-content', request.forMe)(request)


export const newRecord = makeApi<IBasePluginStorageInfo & IContent & {
    all: boolean
}>('post', 'plugin-storage/new-record')

export const searchRecords = makeApi<ISearchRecord, IBaseStorageContent[]>('get', 'plugin-storage/search-records')

export const editRecord = makeApi<IBasePluginStorageInfo & IContent>('post', 'plugin-storage/edit-record')

export const deleteRecord = makeApi<IBasePluginStorageInfo>('post', 'plugin-stroage/delete-record')

export const deleteByIndex = makeApi<ISearchRecord>('post', 'plugin-storage/delete-by-index')

export const removeApplication = makeApi<{application: string}>('post', 'plugin-storage/remove-application')
