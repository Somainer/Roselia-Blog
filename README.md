# Roselia-Blog 3.0
## A new trial of blog system. 

A single page app with slight SEO optimization, can also be deployed as an anti-SEO blog.

虽然是一个单页APP，但是也能够做到搜索引擎优化，同时正因为是SPA，可以进行反搜索引擎优化部署，阻止搜索引擎爬虫爬取你的文章。

> Demo: [Roselia-Blog](https://roselia.moe/blog/)

### Usage:
> * 安装python3 & node & yarn
> * 设置 api_server/config.py && frontend/src/common/config.js
> * **!重要!** 在`secret.py`里面填写`APP_KEY`&`APP_SALT`或者改为`gen_key()`每次在启动时改变。
> * 将你需要的图片放在 static_assets/img 里面
> * api_server/roselia.py build
> * RUN api_server/roselia.py run-prod (For production)
> * Access localhost:5000

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

对理工科用户特别友好，原生支持：

* 代码高亮
* 内嵌公式
* 侧边栏导航
* 站内文章链接预览
* 文章内引用文献预览&跳转
* 黑幕支持（~黑幕内容~）
* 文章内迷你脚本&字符串插值 r{{ 表达式 }}（roselia-script）

## roselia-script(~~其实只是普通的字符串插值~~)

语法： (Roselia|roselia|r|R){{(expression)}}

然后这个表达式的返回值将被插入到对应位置中，如果该表达式以分号为结尾，就将被视为语句，其结果将被丢弃。

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

`Y`: 大名鼎鼎的Y-组合子[Y-Combinator](https://roselia.moe/blog/post?p=30)

`changeThemeOnce(theme: Partial<typeof config.theme>): void` 改变主题，在切换文章时还原

`changeTheme(theme: Partial<typeof config.theme>): void` 直到刷新之前，改变主题（需要征求`theme`权限）

`resetTheme(): void` 重置主题（需要征求`theme`权限）

`saveCurrentTheme(): void` 保存当前主题 （需要征求`theme`权限）

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
