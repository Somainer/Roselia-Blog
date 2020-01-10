import utils from '@/common/utils'
import { userInfoManager, IRoseliaUserData } from '@/common/UserInfoManager'


const autoRefresh = (user: IRoseliaUserData) => {
    if(user && user.token) {
        if (utils.isTokenExpired(user.token)) {
            utils.refreshToken()
        } else {
            const expiryTime = utils.getTokenExpiryTime(user.token)
            const expiryOffsetMs = expiryTime.getTime() - (new Date).getTime();
            setTimeout(utils.refreshToken, expiryOffsetMs)
        }
    }
}

userInfoManager.addChangeListener(autoRefresh)
if(!userInfoManager.isEmpty) {
    autoRefresh(userInfoManager.getPayload())
}
