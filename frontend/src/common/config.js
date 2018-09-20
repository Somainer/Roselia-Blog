let BLOG_TITLE = 'Roselia-Blog'
let BLOG_MOTTO = 'Do what you want to do, be who you want to be.'
// const apiBase = '/api'
// const apiBase = 'http://localhost:5000/api'
// const apiBase = 'https://roselia.moe/blog/api'
const urlPrefix = ''
const apiBase = `${urlPrefix}/api`
export default {
  title: BLOG_TITLE,
  motto: BLOG_MOTTO,
  apiBase: apiBase,
  theme:
    {
      primary: '#6670ed',
      secondary: '#890f87',
      accent: '#dd0087',
      error: '#FF4A4A',
      warning: '#dd2200',
      info: '#00aabc',
      success: '#229977'
    },
  roseliaScript: false,
  urlPrefix
}
