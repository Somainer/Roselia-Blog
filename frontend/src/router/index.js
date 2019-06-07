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
import TokenRefresh from '../components/console/TokenRefresh'
import Timeline from '../components/BlogTimeline'
import SetNickname from '../components/console/SetNickname'
import OAuthAccounts from  '../components/console/OauthBind'
import TwoStepAuth from '../components/console/TwoStepAuth'
import SystemMonitor from '../components/console/SystemMonitor'
import DraftManage from '../components/console/DraftManage'

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
          path: ':postLink',
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
      name: 'userspace',
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
          path: '/',
          name: 'console-index',
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
