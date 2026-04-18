import axios from 'axios'
import progress from '../plugins/progress'

const instance = axios.create()

instance.interceptors.request.use(config => {
  progress.start()
  return config
})

instance.interceptors.response.use(response => {
  response.status === 200 ? progress.finish() : progress.fail()
  return response
}, error => {
  progress.fail()
  return Promise.reject(error)
})

export default instance
