/**
 * Created by somai on 2017/8/15.
 */
var resizer = function () {
    //document.getElementsByClassName('parallax-container')[0].style.minHeight = window.innerHeight - document.getElementById('mobile-nav').style.height + "px";
    //$('.parallax-container').animate({height: (window.innerHeight*0.618 - $('#mobile-nav').height()) + "px"});
    $('.parallax-container').css({minHeight: "100%"});
    $('#main-pic').css({width: (window.innerWidth)});
    //document.getElementById("homura").width = window.innerWidth;
};

window.app = {};

app.makeRedirect = function (from) {
    utils.setRedirect(utils.getAbsPath());
    window.location.href = "./" + from;
};

app.getTag = () => utils.getArguments().tag || null;

function get_url_by_tag(tag) {
    return "./?tag="+ tag;
}

app.getPageOffset = function (offset) {
    let page = parseInt(utils.getArguments().page || 1);
    let res = page + offset;
    if(res>0 && res <= app.pages) return res;
    return -1;
};

app.shiftPage = function (offset) {
    let page = this.getPageOffset(offset);
    if(page === -1) return;
    $("body,html").animate({scrollTop: 0}, 'fast', 'swing');
    history.pushState({id: page}, `${utils.BLOG_TITLE} - Page#${page}`, './?page='+page);
    document.title = `${utils.BLOG_TITLE} - Page#${page}`
    this.getPosts(page);
};

app.getPosts = function (page) {
    let user_data = utils.getLoginData();
    let get_data = {};
    if(user_data){
        get_data.token = user_data.token;
    }
    let bar = new AdvBar();
    bar.startAnimate();
    let tag = app.getTag();
    if(tag) get_data.tag = tag;
    page = page || utils.getArguments().page || 1;
    get_data.page = page;
    app.current = parseInt(page);
    app.nextPage = app.getPageOffset(1)
    app.prevPage = app.getPageOffset(-1)
    get_data.limit = 6;
    $.ajax({
        type: "GET",
        url: utils.apiFor("posts"), //"./api/posts",
        contentType: "application/json",
        dataType: "json",
        data: get_data,
        success: function (raw_data) {
            let data = raw_data.data;
            console.log(tag);
            if(tag){
                if(!data.length) {
                    data = [{
                        title: 'Tag Not Found',
                        subtitle: 'Please check your tag.',
                        date: (new Date()).toDateString(),
                        tags: ['404'],
                        id: -1
                    }];bar.setColor("#ff80ab", "#c51162");
                }
                $("#main-title").text(tag);
                $("#sub-title").text("Posts for tag: " + tag);
                document.title = "Tag: " + tag;
            }
            if(!raw_data.valid){
                if(user_data) Materialize.toast("Token expired.");
                utils.removeLoginData();
                utils.setLoginUI(), app.userData = null;
            }
            //data.reverse();
            app.postData = data;
            app.preloaded = false;
            app.total = parseInt(raw_data.total);
            app.pages = parseInt(raw_data.pages);
            app.current = parseInt(page);
            app.nextPage = app.getPageOffset(1)
            app.prevPage = app.getPageOffset(-1)
            app.mainVue.$nextTick(() => app.onLoaded());
            //console.log(data.reverse());
            /*
            new Vue({
                el: '#content',
                data: {
                    posts: app.postData,
                    userData: utils.getLoginData(),
                    prev: app.getPageOffset(-1),
                    next: app.getPageOffset(1),
                    app: app
                }
            });*/
            $("#content").fadeIn();
            bar.stopAnimate();

        },
        error:function () {
            bar.setColor("#ff80ab", "#c51162");
            bar.stopAnimate();
            Materialize.toast("Network Error!", 2000);
        }
    });
    /*
    $.getJSON('./api/posts', get_data, function (raw_data) {
        let data = raw_data.data;
        console.log(tag);
        if(tag){
            data = data.filter(function (post) {
                return post.tags.map(s => s.toLocaleLowerCase()).indexOf(tag.toLocaleLowerCase()) > -1;
            });
            if(!data.length) {
                data = [{
                    title: 'Tag Not Found',
                    subtitle: 'Please check your tag.',
                    date: (new Date()).toDateString(),
                    tags: ['404'],
                    id: -1
                }];
            }
            $("#main-title").html(tag);
            $("#sub-title").html("Posts for tag: " + tag);
            document.title = "Tag: " + tag;
        }
        if(!raw_data.valid){
            if(user_data) Materialize.toast("Token expired.");
            utils.removeLoginData();
        }
        //data.reverse();
        app.postData = data;
        app.total = parseInt(raw_data.total);
        app.pages = parseInt(raw_data.pages);
        app.current = parseInt(page);
        //console.log(data.reverse());
        new Vue({
            el: '#content',
            data: {
                posts: app.postData,
                userData: utils.getLoginData(),
                prev: app.getPageOffset(-1),
                next: app.getPageOffset(1),
                app: app
            }
        });
        $("#content").fadeIn();
        bar.stopAnimate();
    });*/
};

app.openModal = function (mid) {
    $('#modal-' + mid).modal().modal('open');
};

app.deletePost = function (pid) {
    let userData = utils.getLoginData();
    if(!(userData && userData.role)){
        Materialize.toast("You are not supposed to do this.", 2000);
        return;
    }
    $("#post-"+pid).fadeOut();
    let bar = new AdvBar("#ff8a80", "#d50000");
    bar.startAnimate();
    $.ajax({
        type: "DELETE",
        url: utils.apiFor("remove"), //"./api/remove",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({postID: pid, token:userData.token}),
        success: function (data) {
            console.log(data);
            //data = JSON.parse(data);
            if(data.success){
                bar.stopAnimate();
                Materialize.toast("Success!", 2000);
            }else{
                $("#post-"+pid).fadeIn();
                bar.setColor("#ff80ab", "#c51162");
                bar.stopAnimate();
                if(data.msg === 'expired'){
                    Materialize.toast('Token Expired!', 2000, "", function () {
                        app.makeRedirect('login.html', window.location.href);
                    });
                }else{
                    Materialize.toast(data.msg);
                }
            }
        },
        error:function () {
            bar.setColor("#ff80ab", "#c51162");
            bar.stopAnimate();
            $("#post-"+pid).fadeIn();
            Materialize.toast("Network Error!", 2000);
        }
    })
};

app.checkTime = function(){
    let hour = (new Date).getHours();
    let morning = (hour>6 && hour<18);
    const PICS = [['static/img/bg_n0.png','static/img/bg_n1.jpg','static/img/bg_n2.jpg','static/img/bg_n3.jpg'], ['static/img/bg_m0.jpg','static/img/bg_m1.jpg','static/img/bg_m2.jpg']];
    let pics_arr = PICS[morning + 0];
    $("#main-pic").attr('src', pics_arr[Math.floor(Math.random()*pics_arr.length)]);
}

app.initVue = function(){
    this.preloaded = (window.ROSELIA_CONFIG && ROSELIA_CONFIG.preloaded) || false;
    this.postData = []
    this.userData = utils.getLoginData()
    this.nextPage = this.getPageOffset(1)
    this.prevPage = this.getPageOffset(-1)
    this.mainVue = new Vue({
        el: '#content',
        data: {
            posts: this.postData,
            userData: this.userData,
            prev: this.prevPage,
            next: this.nextPage,
            app: this
        }
    });
}

app.onLoaded = function(){
    utils.colorUtils.apply({selector: "#main-pic", target:"body,.card,.modal,.modal-footer,.modal-content", text:"#content,#sub-title,#date,.card-content,.no-delete", changeText: true, textColors:{light:"#eeeeee", dark:"#212121"}});
    if(app.lazyLoad) app.lazyLoad.load();
    else app.lazyLoad = utils.LazyLoad.of({placeHolder: "static/img/observe.jpg"});
}

$(document).ready(function () {
    app.checkTime();
    let userData = utils.getLoginData();
    $("meta[name=apple-mobile-web-app-title]").attr("content", utils.BLOG_TITLE);
    $(".button-collapse").sideNav();
    $('.parallax').parallax();
    $(window).resize(utils.throttle(resizer, 500).runAfterDeclare());
    app.userData = userData;
    utils.setLoginUI(userData);
    addEventListener("storage", e => (e.key === 'loginData') && (utils.setLoginUI(), app.getPosts(), (app.userData = utils.getLoginData())));
    $(".modal").modal();
    app.initVue();
    if(window.ROSELIA_CONFIG && (!userData)){
        let conf = window.ROSELIA_CONFIG;
        ["total", "pages", "current"].forEach(attr => app[attr] = conf[attr]);
        app.nextPage = app.getPageOffset(1);
        app.prevPage = app.getPageOffset(-1);
        app.onLoaded();
    }
    else {
        app.preloaded = false;
        app.getPosts();
    }
    history.replaceState({id: app.current}, "", window.location.href)
    window.addEventListener('popstate', e => e.state.id && app.getPosts(e.state.id))
    $(".dropdown-button").dropdown();
    $(window).scroll(utils.throttle(function(){
        $(".gotop .btn-floating, .gotop.btn-floating")[["remove", "add"][($(window).height()>$(document).scrollTop())+0]+"Class"]("scale-to-zero");
    }, 500).runAfterDeclare());
});