# Roselia-Blog-NEO
## A new trial of blog system. 
    同时是本人的JavaScript学习日程，第一个文件，编辑自2017-8-15，我开始学习JavaScript。这个Blog作为练手项目，比较私人化，有些令人头疼的历史遗留问题……原定彻底通过AJAX加载所有内容，QTMD SEO，但是Roselia-Blog-NEO这个Branch是我尝试解决SEO问题的一个尝试。


> NEO VS Normal
    
    NEO 分支将在第一次请求时返回渲染好的页面，后续内容再通过AJAX加载。
    没了，就这一个改动……

> Demo: [Roselia-Blog](https://roselia.moe/blog/)
---
由于定位是一个由个人维护的网站，故暂时不开放注册。今后可能也不会……
---
### Usage:

> * RUN api_server/api_server.py
> * Access localhost:5000
 ### Also capable with Nginx/Caddy etc.:
 > * Set proxy rule of localhost/api -> localhost:5000/api 

>Oh, don't forget:
    
    将api_server文件夹剪切到整个项目之外运行，不然别人可以直接把服务脚本都下过来……
    外层的服务器可以为/static文件夹建立特殊规则，使其可以不通过api_server.