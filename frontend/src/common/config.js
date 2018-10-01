let BLOG_TITLE = 'Roselia-Blog'
// let BLOG_TITLE = 'Mohuety'
let BLOG_MOTTO = 'Do what you want to do, be who you want to be.'
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
export default {
  title: BLOG_TITLE,
  motto: BLOG_MOTTO,
  apiBase: apiBase,
  theme: roseliaTheme,
  roseliaScript: false,
  urlPrefix
}
