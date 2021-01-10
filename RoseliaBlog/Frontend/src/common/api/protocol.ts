import utils from '@/common/utils'
import {mapToUnderline, mapToCamelCase} from '@/common/helpers'
type Methods = 'get' | 'post' | 'put' | 'delete'

export const makeApi = <Request extends object, Response extends object = any>(method: Methods, path: string, withToken: boolean = true) => (req: Request) => {
    return utils.fetchJSONWithSuccess(utils.apiFor(path), method, mapToUnderline(req), withToken).then(mapToCamelCase) as Promise<Response>
}
