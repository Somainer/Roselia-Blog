import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '../components/HelloWorld'
import BlogIndex from '../components/BlogIndex'
import BlogLogin from '../components/BlogLogin'
import BlogPost from '../components/BlogPost'
import EditPost from '../components/PostEdit'
import NotFound from '../components/BlogError'
import BlogUserSpace from '../components/BlogUserSpace'
import meta from '../common/config'
import VueWechatTitle from 'vue-wechat-title'

import changePW from '../components/console/ChangePassword'
import RemoteLogin from '../components/console/RemoteLogin'
import userManagement from '../components/console/UserManagement'
import ConsoleIndex from '../components/console/ConsoleIndex'

Vue.use(Router)

Vue.use(VueWechatTitle)

export default new Router({
  mode: 'history',
  base: meta.urlPrefix,
  routes: [
    {
      path: '/hello',
      name: 'HelloWorld',
      component: HelloWorld
    },
    {
      path: '/',
      name: 'index',
      component: BlogIndex,
      meta: {
        title: meta.title
      }
    },
    {
      path: '/login',
      name: 'login',
      component: BlogLogin,
      meta: {
        title: 'Login'
      }
    },
    {
      path: '/post',
      name: 'post',
      component: BlogPost
    },
    {
      path: '/edit',
      alias: '/add',
      name: 'edit',
      component: EditPost
    },
    {
      path: '/userspace',
      alias: '/me',
      name: 'userspace',
      component: BlogUserSpace,
      meta: {
        title: 'Console'
      },
      children: [
        {
          path: 'change-password',
          name: 'changePassword',
          component: changePW
        },
        {
          path: 'remote-login',
          name: 'remoteLogin',
          component: RemoteLogin
        },
        {
          path: 'user-management',
          name: 'userManagement',
          component: userManagement
        },
        {
          path: '/',
          name: 'console-index',
          component: ConsoleIndex
        }
      ]
    },
    {
      path: '*',
      name: 'notFound',
      alias: '/404',
      component: NotFound,
      meta: {
        title: '404 Not Found'
      }
    }
  ]
})
