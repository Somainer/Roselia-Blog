# Roselia-Blog

Roselia-Blog 是一个博客引擎，前端大部分基于 `TypeScript` 编写，后端使用`Python`编写。

A single page app with slight SEO optimization, can also be deployed as an anti-SEO blog.

虽然是一个单页APP，但是也能够做到搜索引擎优化，同时正因为是SPA，可以进行反搜索引擎优化部署，阻止搜索引擎爬虫爬取你的文章。

> Demo: [Roselia-Blog](https://roselia.moe/blog/)

[English](./README.md) | 简体中文

### Usage（最简版）:
> * 安装python3.6+ & node & yarn
> * 设置 api_server/config.py && frontend/src/common/config.js
> * **!重要!** 在`secret.py`里面填写`APP_KEY`&`APP_SALT`或者改为`gen_key()`每次在启动时改变。
> * 将你需要的图片放在 static_assets/img 里面
> * api_server/roselia.py build
> * RUN api_server/roselia.py run-prod (For production)
> * Access localhost:5000

## 使用方法

### 依赖项
* `Python 3.6+` （因为使用了字符串插值）
* `NodeJS` （为了编译前端）
* `Yarn pkg`（NodeJS的包管理器）

接下来可以通过`pip install -r requirements.txt`来安装python的依赖包。
接下来切换到`./frontend`，执行`yarn`.

### 设置

在`api_server/config.py`，有如下内容供设置：
* `BLOG_LINK`: 博客链接
* `BLOG_INFO`: 自定义标题等 (以供服务器端渲染)
* `DEBUG`: 如果你想在生产环境中使用他，请确保该选项为 `False`.
* `ANTI_SEO`: 如果为`True`，关闭SEO优化，这样搜索引擎爬虫将无法获取信息。注意某些支持执行JavaScript脚本的爬虫（比如Google）仍然有可能获取内容。
* `HOST`: 监听地址，默认 `0.0.0.0`.
* `PORT`: 监听端口，默认 5000.
* `DB_PATH`: 服务器数据库地址。
* `UPLOAD_DIR`: 图片上传文件夹，留空以关闭上传到服务器的功能。

在`api_server/secret.py`中，有如下内容以供设置：
* `APP_KEY` & `APP_SALT`: 生成token所需的app key 和 secret。 将其改为 `gen_key()`，每次启动生成不同的值，或者设定一个自定义的字符串值。
* `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: GitHub OAuth 所需的id和secret，留空则关闭。
* `MICROSOFT_CLIENT_ID` & `MICROSOFT_CLIENT_SECRET`: Microsoft Accout OAuth 所需的id和secret，留空则关闭。
* `CHEVERETO_API_KEY` & `CHEVERETO_API_ENDPOINT`: 上传到chevereto服务器所需的API和API key，留空以关闭。
* `SM_MS_API_TOKEN`: 上传到 `sm.ms` 图片服务的API token。留空关闭。

在 `frontend/src/common/config.js`，有如下内容供设置 (在底下的 `export default` 语句中):
* `title`: 博客标题
* `motto`: 博客座右铭
* `apiBase`: 网站API网址，默认 `/api`.
* `theme`: 博客主题
* `enableRoseliaScript`: 控制是否启用文章内嵌脚本。
* `enableAskYukina`: 控制是否启动助手，请将其设为false，该功能仍然在开发中。
* `footName`: 网页页脚的内容。
* `urlPrefix`: 网址前缀，默认空。
* `images.indexBannerImage`: 主页图片
* `images.lazyloadImage`: 图片懒加载时的占位图片
* `images.timelineBannerImage`: 时间轴页的图片

### 关于`api_server/roselia.py`

`roselia.py` 提供了一些指令便于启动或者构件环境。
用法：`roselia.py [command]`

Commands: 
> * serve: 根据 `DEBUG` 与否启动开发或者生产环境。
> * run-dev: 强制启动开发环境
> * run-prod: 强制启动生产环境
> * run-gunicorn: 使用`gunicorn`启动环境。
> * compress-assets: **删除原有的static文件夹**，将`static_assets`复制到`static`，压缩其中的图片
> * copy-assets 将**已经build完成的**前端文件复制到static，并且替换template中的CSS/JS文件名
> * build-frontend 编译前端
> * build = compress-assets + build-frontend + copy-assets
> * assets = compress-assets + copy-assets

### 关于启动开发环境
启动开发环境，你需要先启动`yarn serve`，再启动`roselia.py run-dev`

目前正在逐步迁移到`TypeScript`

## 特点

如果你经常在文章中写代码或者公式，那么该博客十分适合你，因为Roselia-Blog
对理工科用户特别友好，原生支持：

* 代码高亮
* 内嵌公式
* 侧边栏导航
* 站内文章链接预览
* 文章内引用文献预览&跳转
* 黑幕支持（~黑幕内容~，格式为用`~`围绕的文字）
* 文章内迷你脚本&字符串插值 r{{ 表达式 }}（roselia-script）
* 通过粘贴或者拖拽来上传图片
* 直接粘贴来自VSCode中的代码片段（自动识别语言）
* 隐藏文章：只能通过链接访问。
* 私密文章：只有相应等级的用户才能访问
* 第三方账号登陆：支持GitHub和微软账户
* 二步验证

## roselia-script(~~其实只是普通的字符串插值~~)

语法： (Roselia|roselia|r|R){{(expression)}}

然后这个表达式的返回值将被插入到对应位置中，如果该表达式以分号为结尾，就将被视为语句，其结果将被丢弃。

因为Roselia-Blog不开放注册，因此我们将完全信任所有的用户，该功能对所有用户的文章和评论开放。
该功能可被用来做字符串插值，开关某些功能或者动态修改文章或评论的元信息。

存在内置api

`def (name, func)` 定义函数，或者为api结果命名

`music (meta, autoplay = false, onPlayerReady = null)` 插入一首歌（基于APlayer）

`onceLoad (fn)`: 定义文章加载完成后的回调

`onceUnload (fn)`: 文章销毁时的回调

`getElement (el)`: 获取对应的元素

`btn (text, onClick, externalClasses = '', externalAttributes?: object)`：插入一个按钮

`toast (text, color)`: 显示一个toast通知

`then (fn)`: 在DOM完成后执行（对DOM的操作请务必在then中进行，除非你确信此时已经有这个元素了）

`audio (src)` 插入一段原生audio Element

`importJS (url, onComplete)`: 插入外置JS代码（会影响到之后的文章，慎用）

`element (el: RSElementSelector): Promise<HTMLElement>`

```typescript
createElement<K extends keyof HTMLElementTagNameMap>(
    type: K,
    extend?: RecursivePartial<HTMLElementTagNameMap[K]>,
    children?: (Node | string)[]
): HTMLElementTagNameMap[K]
```
创建类型为`type`的元素，将其属性根据`extend`赋值，最后加入`childen`作为子元素。

`createTextNode(text: string): Text`: 创建文本节点

`Y`: 大名鼎鼎的Y-组合子[Y-Combinator](https://roselia.moe/blog/post?p=30)

`currentTheme()` 获取当前主题

`changeThemeOnce(theme: Partial<typeof config.theme>): void` 改变主题，在切换文章时还原

`changeTheme(theme: Partial<typeof config.theme>): void` 直到刷新之前，改变主题（需要征求`theme`权限）

`resetTheme(): void` 重置主题（需要征求`theme`权限）

`saveCurrentTheme(): void` 保存当前主题 （需要征求`theme`权限）

`switchToColorMode(isLight: boolean)`: 改变颜色模式，如果`isLight`为真则切换为浅色模式，否则切换为深色模式。

`async forceSwitchToColorMode(light: boolean)`: 切换颜色模式直到刷新。

```typescript
changeExtraDisplaySettings(settings: Partial<{
    metaBelowImage: boolean,
    blurMainImage: boolean,
    disableSideNavigation: boolean
  }>)
```
改变额外的显示设置：
* `metaBelowImage` 控制文章的信息是否应该处于图片的下方
* `blurMainImage` 控制文章主图片是否应该模糊
* `disableSideNavigation` 控制是否关闭侧边导航

`sendNotification(notification: INotification)`: 向用户发送通知 (通过通知总线)

例如：插入一首歌（会在切换文章时自动销毁）：
```
r{{
    music({
       title: '陽だまりロードナイト',
        author: 'Roselia',
        url: 'https://cdn.roselia.moe/static/img/roselia/hidamari.mp3',
        pic: 'https://p4.music.126.net/gT4F8nlV2Io58GTVAEWyLw==/18636722092789001.jpg'
    })
}}
```

如果我想要获取这个播放器，并且希望利用APlayer的API的话：

```
roselia{{
    def('player', music({...}, false, player => {
        console.log(player, 'is ready!')
        toast('Player is ready!')
        player.play()
    }))
}}
```

在此之后，就可以用player代指播放器实例了。

```
r{{
	def('revue', audio('https://static.roselia.moe/static/audio/revue.mp3'))
    
}}
R{{
    def('playRevue', () => getElement(revue).play()),
    def('playbtn', btn('play', playRevue))
}}
r{{
	then(() => getElement(playbtn).style.color = '#66ccff')
}}

//Or

r{{
	element(playbtn).then(e => e.style.color = '#66ccff')
}}
```
遗憾的是，为插入一个元素，就必须有一个r{{}}，因此可能会出现不少的R{{}}影响美观。

但是，迷你脚本的出现确实大大增加了文章以及评论的灵活性，比起script标签，代码是运行在沙箱环境中的，因此可以受保护地访问某些对象，并且用一些受控的API进行访问，保障了安全性，
在插件相对匮乏（其实根本没有）的Roselia-Blog里，迷你脚本可以在一定程度上实现部分插件的功能。但是，`Roselia-Script`仍然能进行沙箱逃逸，并且仍然能执行恶意代码，因此目前只对登陆用户开放。

比如，对于登陆用户，在其迷你脚本执行的上下文里面就会有`comment`作为其评论的信息对象，用户可以修改除了评论ID等重要信息以外的信息，可以做到神奇的效果，同时执行的脚本运行在沙箱中可以确保一定程度上的安全，而且基于Roselia-Blog的邀请制注册，评论区中脚本的使用是可控的，因此可以放心使用。如果仍然不放心，可以在`config.js`里面把`enableRoseliaScript`设置为`false`从而彻底关闭这个功能。
