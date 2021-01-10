import { makeApi } from './protocol'
import { IRoseliaUserMeta } from '../post-information'


export const getUserMeta = makeApi<{
    username: string
}, IRoseliaUserMeta>('get', 'user/user-meta')

export const botUserMeta: IRoseliaUserMeta = {
    id: 0,
    username: 'Yukina',
    role: 0,
    nickname: 'Yukina (Bot)',
    avatar: 'https://img.lisa.moe/images/2019/04/15/GQ6GLDt_.jpg'
}
