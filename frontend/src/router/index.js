import Vue from 'vue'
import Router from 'vue-router'

import VueWechatTitle from 'vue-wechat-title'
import meta from '../common/config'

/* Must be imported components */
import BlogIndex from '../components/BlogIndex'
import BlogPost from '../components/BlogPost'

/* Can be loaded later, but still important. */
// import BlogLogin from '../components/BlogLogin'
const BlogLogin = () => import(/* webpackChunkName: "ringing-bloom" */ '../components/BlogLogin')
// import NotFound from '../components/BlogError'
const NotFound = () => import(/* webpackChunkName: "ringing-bloom" */ '../components/BlogError')
// import Timeline from '../components/BlogTimeline'
const Timeline = () => import(/* webpackChunkName: "ringing-bloom" */ '../components/BlogTimeline')

/* Only for logged-ins */
// import EditPost from '../components/PostEdit'
const EditPost = () => import(/* webpackChunkName: "fire-bird" */ '../components/PostEdit')
// import HelloWorld from '../components/HelloWorld'
const HelloWorld = () => import(/* webpackChunkName: "fire-bird" */ '../components/HelloWorld')
// import BlogUserSpace from '../components/BlogUserSpace'
const BlogUserSpace = () => import(/* webpackChunkName: "fire-bird" */ '../components/BlogUserSpace')
// import changePW from '../components/console/ChangePassword'
const changePW = () => import(/* webpackChunkName: "fire-bird" */ '../components/console/ChangePassword')
// import RemoteLogin from '../components/console/RemoteLogin'
const RemoteLogin = () => import(/* webpackChunkName: "fire-bird" */ '../components/console/RemoteLogin')
// import userManagement from '../components/console/UserManagement'
const userManagement = () => import(/* webpackChunkName: "fire-bird" */ '../components/console/UserManagement')
// import ConsoleIndex from '../components/console/ConsoleIndex'
const ConsoleIndex = () => import(/* webpackChunkName: "fire-bird" */ '../components/console/ConsoleIndex')
// import TokenRefresh from '../components/console/TokenRefresh'
const TokenRefresh = () => import(/* webpackChunkName: "fire-bird" */ '../components/console/TokenRefresh')
// import SetNickname from '../components/console/SetNickname'
const SetNickname = () => import(/* webpackChunkName: "fire-bird" */ '../components/console/SetNickname')
// import OAuthAccounts from  '../components/console/OauthBind'
const OAuthAccounts = () => import(/* webpackChunkName: "fire-bird" */ '../components/console/OauthBind')
// import TwoStepAuth from '../components/console/TwoStepAuth'
const TwoStepAuth = () => import(/* webpackChunkName: "fire-bird" */ '../components/console/TwoStepAuth')
// import SystemMonitor from '../components/console/SystemMonitor'
const SystemMonitor = () => import(/* webpackChunkName: "fire-bird" */ '../components/console/SystemMonitor')
// import DraftManage from '../components/console/DraftManage'
const DraftManage = () => import(/* webpackChunkName: "fire-bird" */ '../components/console/DraftManage')
// import UploadedImagesManagement from '../components/console/UploadedImagesManagement'
const UploadedImagesManagement = () => import(/* webpackChunkName: "fire-bird" */ '../components/console/UploadedImagesManagement')

Vue.use(Router)

Vue.use(VueWechatTitle)

export default new Router({
  mode: 'history',
  base: meta.urlPrefix,
  routes: [
    {
      path: '/hello',
      name: 'helloWorld',
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
      component: BlogPost,
      children: [
        {
          path: 'shared/:shareId',
          name: 'sharedPost',
          component: BlogPost
        },
        {
          path: 'live-preview/:previewPostId',
          name: 'postLivePreview',
          component: BlogPost
        },
        {
          path: ':postLink+',
          name: 'postWithEternalLink',
          component: BlogPost
        }
      ]
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
      component: BlogUserSpace,
      meta: {
        title: 'Console'
      },
      children: [
        {
          path: 'change-password',
          name: 'changePassword',
          component: changePW,
          meta: {
            title: 'Change Password'
          }
        },
        {
          path: 'remote-login',
          name: 'remoteLogin',
          component: RemoteLogin,
          meta: {
            title: 'Remote Login'
          }
        },
        {
          path: 'user-management',
          name: 'userManagement',
          component: userManagement,
          meta: {
            title: 'Manage Users'
          }
        },
        {
          path: 'token-refresh',
          name: 'tokenRefresh',
          component: TokenRefresh,
          meta: {
            title: 'Refresh Tokens'
          }
        },
        {
          path: 'account-settings',
          name: 'setNickname',
          component: SetNickname,
          meta: {
            title: 'Account Settings'
          }
        },
        {
          path: 'oauth-accounts',
          name: 'oauthAccounts',
          component: OAuthAccounts,
          meta: {
            title: 'OAuth Accounts'
          }
        },
        {
          path: '2-step-auth',
          name: 'twoStepAuth',
          component: TwoStepAuth,
          meta: {
            title: 'Two Factor Authentication'
          }
        },
        {
          path: 'system-monitor',
          name: 'systemMonitor',
          component: SystemMonitor,
          meta: {
            title: 'System Monitor'
          }
        },
        {
          path: 'manage-drafts',
          name: 'manageDrafts',
          component: DraftManage,
          meta: {
            title: 'Draft Management'
          }
        },
        {
          path: 'manage-images',
          name: 'manageImages',
          component: UploadedImagesManagement,
          meta: {
            title: 'Uploaded Image Management'
          }
        },
        {
          path: '/',
          name: 'userspace',
          component: ConsoleIndex,
          meta: {
            title: 'Roselia-Blog Console'
          }
        }
      ]
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: Timeline,
      meta: {
        title: 'Timeline'
      },
      children: [
        {
          name: 'userTimeline',
          path: ':username',
          component: Timeline
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
