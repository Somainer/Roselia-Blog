import axios from 'axios'
import app from '../main'

const instance = axios.create()

instance.interceptors.request.use(config => {
  app.$Progress.start()
  return config
})

instance.interceptors.response.use(response => {
  response.status === 200 ? app.$Progress.finish() : app.$Progress.fail()
  return response
}, error => {
  app.$Progress.fail()
  return Promise.reject(error)
})

export default instance
