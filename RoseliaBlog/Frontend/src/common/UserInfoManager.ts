import { RoseliaStorage } from "./RoseliaStorage";

export interface IRoseliaUserData {
    username: string
    nickname: string
    role: number
    token: string
    rftoken?: string
}

export const userInfoManager = new RoseliaStorage<IRoseliaUserData>('loginData')
