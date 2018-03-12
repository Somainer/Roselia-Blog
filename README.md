# Roselia-Blog-NEO
## A new trial of blog system. 
同时是本人的JavaScript学习日程，第一个文件，编辑自2017-8-15，我开始学习JavaScript。这个Blog作为练手项目，比较私人化，有些令人头疼的历史遗留问题……原定彻底通过AJAX加载所有内容，QTMD SEO，但是Roselia-Blog-NEO这个Branch是我尝试解决SEO问题的一个尝试。


> NEO VS Normal
    
    NEO 分支将在第一次请求时返回渲染好的页面，后续内容再通过AJAX加载。
    我已经放弃master branch了

> Demo: [Roselia-Blog](https://roselia.moe/blog/)
### Usage:
> * 设置 api_server/config.py
> * 编译静态文件
> * RUN api_server/api_server.py
> * Access localhost:5000
 ### Also capable with Nginx/Caddy etc.:
    
    将编译完成后的static文件夹拷贝到Nginx/Caddy文件夹下，交由他们处理，设置static文件夹通过静态服务器代理，其余路径通过api_server，即localhost:5000

### 编译静态文件:

增加了生成压缩图片/js的脚本，在scripts里面。使用方法：
    
    > cd scripts
    > npm install #(初次运行时安装依赖)
    > ./bootstrap.py
    之后就会生成 static 文件夹，这样才能正常运行