let BLOG_TITLE = process.env.BLOG_TITLE || 'Roselia-Blog'
// let BLOG_TITLE = 'Raspi Blog'
// let BLOG_TITLE = "Somainer's Blog"
let BLOG_MOTTO = process.env.BLOG_MOTTO || 'Do what you want to do, be who you want to be.'
// let BLOG_MOTTO = 'Raspi life.'
// const apiBase = '/api'
// const apiBase = 'http://localhost:5000/api'
// const apiBase = 'https://roselia.moe/blog/api'
const urlPrefix = ''
// const urlPrefix = '/blog'
const apiBase = `${urlPrefix}/api`
const roseliaTheme = {
  primary: '#6670ed',
  secondary: '#890f87',
  accent: '#dd0087',
  error: '#FF4A4A',
  warning: '#dd2200',
  info: '#00aabc',
  success: '#229977'
}
const mohuetyTheme = {
  primary: '#0288d1',
  secondary: '#6292E9',
  accent: '#E08696',
  error: '#FB5458',
  warning: '#FE9952',
  info: '#95CAEE',
  success: '#61BF99'
}

const raspiTheme = {
  primary: '#f50057',
  secondary: '#890f87',
  accent: '#dd0087',
  error: '#FF4A4A',
  warning: '#dd2200',
  info: '#00aabc',
  success: '#229977'
}

module.exports = {
  title: BLOG_TITLE,
  motto: BLOG_MOTTO,
  apiBase: apiBase,
  theme: process.env.BLOG_THEME || roseliaTheme,
  // theme: mohuetyTheme,
  enableRoseliaScript: true,
  enableAskYukina: false,
  footerName: 'Somainer',
  urlPrefix,
  images: {
    indexBannerImage: urlPrefix + '/static/img/bg_n3.jpg',
    postBannerImage: urlPrefix + '/static/img/nest.png',
    lazyloadImage: urlPrefix + '/static/img/observe.jpg',
    timelineBannerImage: urlPrefix + '/static/img/bg_n0.png'
  }
}
