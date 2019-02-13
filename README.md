# Roselia-Blog 3.0
## A new trial of blog system. 

A single page app with slight SEO optimization.

虽然是一个单页APP，但是也能够做到搜索引擎优化。

> Demo: [Roselia-Blog](https://roselia.moe/blog/)

### Usage:
> * 设置 api_server/config.py && frontend/src/common/config.js
> * cd frontend && npm run build
> * RUN api_server/api_server.py
> * Access localhost:5000

然后将front/dist里面的东西拷贝到静态文件服务器就OK了，记得将/api的内容跳转到api_server

如果你需要SEO，你需要将template里面的`index_vue.html`和`post_vue.html`中的css和js文件改为正确的路径。

目前正在逐步迁移到`TypeScript`，但是旧的页面不大可能重写，新的页面将会尝试 `JSX`|`TSX` 写法。

## 特点

对理工选手特别友好，原生支持：

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
```
遗憾的是，为插入一个元素，就必须有一个r{{}}，因此可能会出现不少的R{{}}影响美观，这个只是好玩的实验功能，不建议滥用，一个博客需要那么多动态因素作甚？

但是，迷你脚本的出现确实大大增加了文章以及评论的灵活性，比起script标签，代码是运行在沙箱环境中的，因此可以受保护地访问某些对象，并且用一些受控的API进行访问，保障了安全性，
在插件相对匮乏（其实根本没有）的Roselia-Blog里，迷你脚本可以在一定程度上实现部分插件的功能。