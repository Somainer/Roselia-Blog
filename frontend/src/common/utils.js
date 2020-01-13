import axios from './ajax-bar-axios'
import router from '../router/index'
import config from './config'
import { userInfoManager } from './UserInfoManager';

const utils = {}
utils.apiBase = config.apiBase
// utils.apiBase = 'http://localhost:5000/api'
// utils.apiBase = 'https://roselia.moe/blog/api'
utils.getArguments = function () {
  return this.$route.query
}

utils.setRedirect = function (url) {
  window.sessionStorage.setItem('redirectURL', JSON.stringify(url || utils.getAbsPath()))
}

utils.getRedirect = function () {
  return JSON.parse(window.sessionStorage.getItem('redirectURL'))
}

utils.cleanRedirect = function () {
  window.sessionStorage.removeItem('redirectURL')
}

utils.getAbsPath = function () {
  return window.location.pathname + window.location.search + window.location.hash
}

utils.redirectTo = url => {
  router.push(url || './')
}

utils.getLoginData = () => userInfoManager.getPayload()

utils.setLoginData = data => {
  userInfoManager.setPayload(data)
}

utils.updateLoginData = (fn) => utils.setLoginData(fn(utils.getLoginData()))

utils.removeLoginData = () => userInfoManager.clear()

utils.saveSUToken = function (token) {
  window.sessionStorage.setItem('suToken', token)
}

utils.getSUToken = function () {
  return window.sessionStorage.getItem('suToken')
}

utils.removeSUToken = function () {
  window.sessionStorage.removeItem('suToken')
}

utils.getPosts = function (callback) {
  return this.fetchJSON(this.apiFor('posts')).then(callback)
}

utils.refreshToken = function (token) {
  if (!token) {
    let userData = utils.getLoginData()
    token = userData && userData.rftoken
  }
  if (!token) return Promise.reject('No token')
  return utils.fetchJSON(utils.apiFor('login', 'token', 'refresh'),
    'POST', {token}, false, false).then(function (data) {
    if (data.success) {
      let userData = utils.getLoginData()
      userData && (userData.token = data.token) && utils.setLoginData(userData)
      return userData
    } else {
      // utils.notify(data.msg)
      utils.removeLoginData()
      return Promise.reject(data.msg)
    }
  })
}

utils.formatDate = (date, withTime = false) => {
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return date
    if (withTime) return dateObj.toLocaleString()
    return dateObj.toLocaleDateString()
  } catch (ex) {
    return undefined
  }
}

utils.getPostsData = () => JSON.parse(window.localStorage.postData || 'null')

utils.deleteDraft = () => window.localStorage.removeItem('postDraft')

utils.setPosts = function (data) {
  window.localStorage.postData = JSON.stringify(data)
}

utils.apiFor = (...uri) => `${utils.apiBase}/${uri.join('/')}`

utils.encodeArgs = args => Object.entries(args).map(([v, k]) => `${k}=${v}`).join('&')

utils.processPosts = function (callback) {
  let post = window.localStorage.postData
  if (post) callback(JSON.parse(post))
  else utils.getPosts(callback)
  return false
}
utils.ajaxPromised = function (data) {
  return axios(data).then(x => x.data)
}
utils.fetchJSON = function (url, method = 'GET', payload = {}, withToken = true, individual = true) {
  let loginData = this.getLoginData()
  let token = loginData ? loginData.token : ''
  method = method.toUpperCase()
  if (individual) {
    payload['__timestamp'] = (new Date()).getTime()
  }
  let data = withToken ? Object.assign({}, payload, {token: token}) : payload
  // if (method !== 'GET') data = JSON.stringify(data)
  if (method === 'GET') {
    data = {
      params: data
    }
  }
  return axios[method.toLowerCase()](url, data).then(x => x.data).catch(reason => {
    // app.$Progress.fail()
    return Promise.reject(reason)
  })
}
utils.fetchJSONWithSuccess = function (...args) {
  return this.fetchJSON(...args).then(data => {
    if (!data.success) return Promise.reject(data.msg)
    return data.result || data.data || data
  })
};

utils.getTokenExpiryTime = function (token) {
  try {
    let head = token.split('.')[0]
    let {exp} = JSON.parse(window.atob(head))
    return new Date(exp * 1000)
  } catch (e) {
    console.error(e)
    return new Date()
  }
}

utils.isTokenExpired = function (token) {
  return utils.getTokenExpiryTime(token || this.getLoginData().token) < new Date()
}

utils.showToast = function (text, color = 'info') {
  this.toast.show = false
  this.toast.text = text.toString()
  this.toast.color = color
  this.toast.show = true
}

utils.getToastOption = () => {
  return ({
    show: false,
    text: '',
    color: ''
  })
}
utils.addEventListener = (type, f) => {
  addEventListener(type, f)
  return () => {
    removeEventListener(type, f)
  }
}
utils.addStorageListener = (f) => {
  return utils.addEventListener('storage', f)
}

export default utils
