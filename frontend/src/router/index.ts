import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import meta from '../common/config'

import BlogIndex from '../components/BlogIndex.vue'
import BlogPost from '../components/BlogPost.vue'

const BlogLogin = () => import('../components/BlogLogin.vue')
const NotFound = () => import('../components/BlogError.vue')
const Timeline = () => import('../components/BlogTimeline.vue')

const EditPost = () => import('../components/PostEdit.vue')
const HelloWorld = () => import('../components/HelloWorld.vue')
const BlogUserSpace = () => import('../components/BlogUserSpace.vue')
const changePW = () => import('../components/console/ChangePassword.vue')
const RemoteLogin = () => import('../components/console/RemoteLogin.vue')
const userManagement = () => import('../components/console/UserManagement.vue')
const ConsoleIndex = () => import('../components/console/ConsoleIndex.vue')
const TokenRefresh = () => import('../components/console/TokenRefresh.vue')
const SetNickname = () => import('../components/console/SetNickname.vue')
const OAuthAccounts = () => import('../components/console/OauthBind.vue')
const TwoStepAuth = () => import('../components/console/TwoStepAuth.vue')
const SystemMonitor = () => import('../components/console/SystemMonitor.vue')
const DraftManage = () => import('../components/console/DraftManage.vue')
const UploadedImagesManagement = () => import('../components/console/UploadedImagesManagement.vue')
const AboutComponent = () => import('../components/console/About.vue')

const routes: RouteRecordRaw[] = [
  { path: '/hello', name: 'helloWorld', component: HelloWorld },
  { path: '/', name: 'index', component: BlogIndex, meta: { title: meta.title } },
  { path: '/login', name: 'login', component: BlogLogin, meta: { title: 'Login' } },
  {
    path: '/post',
    name: 'post',
    component: BlogPost,
    children: [
      { path: 'shared/:shareId', name: 'sharedPost', component: BlogPost },
      { path: 'live-preview/:previewPostId', name: 'postLivePreview', component: BlogPost },
      { path: ':postLink+', name: 'postWithEternalLink', component: BlogPost }
    ]
  },
  { path: '/edit', alias: '/add', name: 'edit', component: EditPost },
  {
    path: '/userspace',
    alias: '/me',
    component: BlogUserSpace,
    meta: { title: 'Console' },
    children: [
      { path: 'change-password', name: 'changePassword', component: changePW, meta: { title: 'Change Password' } },
      { path: 'remote-login', name: 'remoteLogin', component: RemoteLogin, meta: { title: 'Remote Login' } },
      { path: 'user-management', name: 'userManagement', component: userManagement, meta: { title: 'Manage Users' } },
      { path: 'token-refresh', name: 'tokenRefresh', component: TokenRefresh, meta: { title: 'Refresh Tokens' } },
      { path: 'account-settings', name: 'setNickname', component: SetNickname, meta: { title: 'Account Settings' } },
      { path: 'oauth-accounts', name: 'oauthAccounts', component: OAuthAccounts, meta: { title: 'OAuth Accounts' } },
      { path: '2-step-auth', name: 'twoStepAuth', component: TwoStepAuth, meta: { title: 'Two Factor Authentication' } },
      { path: 'system-monitor', name: 'systemMonitor', component: SystemMonitor, meta: { title: 'System Monitor' } },
      { path: 'manage-drafts', name: 'manageDrafts', component: DraftManage, meta: { title: 'Draft Management' } },
      { path: 'manage-images', name: 'manageImages', component: UploadedImagesManagement, meta: { title: 'Uploaded Image Management' } },
      { path: 'about', name: 'about', component: AboutComponent },
      { path: '', name: 'userspace', component: ConsoleIndex, meta: { title: 'Roselia-Blog Console' } }
    ]
  },
  {
    path: '/timeline',
    name: 'timeline',
    component: Timeline,
    meta: { title: 'Timeline' },
    children: [
      { name: 'userTimeline', path: ':username', component: Timeline }
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'notFound', alias: '/404', component: NotFound, meta: { title: '404 Not Found' } }
]

const router = createRouter({
  history: createWebHistory(meta.urlPrefix || '/'),
  routes
})

router.afterEach((to) => {
  const title = (to.meta?.title as string | undefined) ?? meta.title
  if (title) document.title = title
})

export default router
