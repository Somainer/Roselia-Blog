var resizer = function () {
    //document.getElementsByClassName('parallax-container')[0].style.minHeight = window.innerHeight - document.getElementById('mobile-nav').style.height + "px";
    $('.parallax-container').css({height: (window.innerHeight - $('#mobile-nav').height())*0.618 + "px"});
    $('#main-pic').css({width: (window.innerWidth)});
    //document.getElementById("homura").width = window.innerWidth;
};

window.app = {};

window.roselia = app;

utils.setUpEvents(app, ['load', 'unload', 'render']);

app.firstLoad = function () {
    $('.parallax-container').stop(false, true).animate({height: (window.innerHeight - $('#mobile-nav').height()) + "px"}, "normal", "swing")
        .delay(1000).animate({height: (window.innerHeight - $('#mobile-nav').height())*0.618 + "px"}, "normal", "swing");
    $("html,body").stop(false, true).delay(1200).animate({scrollTop: $("#content").offset().top}, "normal", "swing");
    $('#main-pic').css({width: (window.innerWidth)});
};
app.getPostNum = () => utils.getArguments().p || -1;

app.showContent = function (data) {
    this.triggerRender(data);
    app.postData = data;
    document.title = data.title;
    $("#main-title").html(data.title);
    $("#sub-title").html(data.subtitle);
    $("#date").html(data.date);
    $("#tags").html("");
    data.tags.forEach(function (t) {
        $("#tags").append(`<a href='./?tag=${t}'><div class='chip waves-effect'>${t}</div></a>`);
    });
    let content = $("#content");
    content.html(data.content);
    $("#main-pic").attr('src', data.img || 'static/img/nest.png');
    data.id && (data.id == app.getPostNum()?history.replaceState({id: data.id}, "", './post?p='+data.id):history.pushState({id: data.id}, "", './post?p='+data.id));
    app.processContent(data.content);
};
app.processContent = function (text) {
    let content = $("#content");
    content.find('img').each(function (i, item) {
        $(item).addClass('responsive-img').addClass("materialboxed");
    });
    content.find('p').each(function (i, item) {
        $(item).addClass('flow-text');
    });
    if (text && text.indexOf('$') !== -1) {
        if(window.MathJax){
            window.MathJax.Hub.Queue(["Typeset",MathJax.Hub,"output"]);
        }
    }
    $('.materialboxed').materialbox();
    if(app.lazyLoad) app.lazyLoad.load();
    else app.lazyLoad = utils.LazyLoad.of({placeHolder: "static/img/observe.jpg"});
    app.setBtns();
    this.setDigest();
    this.trigger("load");
    utils.colorUtils.apply({selector: "#main-pic", text:"#content,#sub-title,#date,.digest-nav-el", changeText: true});
};
app.setBtns = function () {
    let next = app.getOffset(1), prev = app.getOffset(-1);
    $("#next-btn").attr('href', './post?p=' + next).css('display', next>=0?"":"none");
    $("#prev-btn").attr('href', './post?p=' + prev).css('display', prev>=0?"":"none");
};
app.setDigest = function(){
    this.postDigest = $("#content h1,h2,h3").map(function (i) {
        $(this).addClass("section scrollspy");
        return [[this.id = this.id || `section-${i}`, this.innerHTML]];
    }).get();
    let contentClass = ["m9 l10", "m12 l12"], hasDigest = this.postDigest.length > 0;
    $("#content").removeClass(contentClass[hasDigest ^ 0]).addClass(contentClass[hasDigest ^ 1]);
    app.mainVue.$nextTick(function(){
        let $content = $("#content"), $nav = $("#digest-nav");
        $nav.pushpin({
            top: $content.offset().top,
            offset: 150,
            bottom: $content.height() + $content.offset().top - $nav.height()
        });
        $(".scrollspy").scrollSpy();
    });
};
app.loadContent = function (p) {
    if(p === undefined) p = app.getPostNum();
    else app.triggerUnload();
    let notFound = {
            title: 'Page Not Found',
            subtitle: "Please check your post-id. Or try to <a href='login' onclick='utils.setRedirect(utils.getAbsPath())'" +">Login</a>",
            date: (new Date()).toDateString(),
            tags: ['404'],
            content: '<p>There might be some problem here. Please check your input</p><p>Or maybe you know why.</p>',
            notFound: true
        };
    let userData = utils.getLoginData();
    let getData = {};
    if(userData){
        getData.token = userData.token;
    }
    if(p == -1){
        app.showContent(notFound);
    }else{
        let bar = new AdvBar();
        bar.startAnimate();
        $.ajax({
            type: 'GET',
            url: utils.apiFor('post', p),
            contentType: "application/json",
            dataType: 'json',
            data: getData,
            success: function (data) {
                app.loading = false;
                app.preloaded = false;
                app.postData = data;
                if(data === 'null') {
                    data = null;
                }
                data || bar.abort();
                app.showContent(data || notFound);
                bar.stopAnimate();
            },
            error: function () {
                //bar.setColor("#ff80ab", "#c51162");

                app.showContent(notFound);
                bar.abort("#ff80ab", "#c51162");
                //bar.stopAnimate();
            }
        });
        /*
        $.getJSON('./api/post/'+p, getData, function (data) {
            app.loading = false;
            app.postData = data;
            if(data === 'null') data = notFound;
            app.showContent(data || notFound);
            if(callback) callback();
        });*/
    }
};

app.getOffset = function (offset) {
    if(!app.postData) return -1;
    if(offset === 1) return app.postData.next;
    if(offset === -1) return app.postData.prev;
    let idx = app.getPostNum();
    let finalIdx = idx + offset;
    return (finalIdx >= 0)?finalIdx:-1;

};

app.shiftPost = function (offset) {
    let idx = app.getOffset(offset);
    if(idx === -1) return;
    //$("#content").fadeOut();
    app.preloaded = false;
    app.loading = true;
    $("html,body").animate({scrollTop: 0});
    app.loadContent(idx);

};

app.setEditPage = function (e) {
    $(e).attr('href', './edit?post=' + app.getPostNum());
};

$(document).ready(function () {
    $(".button-collapse").sideNav();
    $('.parallax').parallax();
    $(window).resize(utils.throttle(resizer, 500).runAfterDeclare());
    $(window).scroll(utils.throttle(function(){
        $(".gotop .btn-floating, .gotop.btn-floating")[["remove", "add"][($(window).height()>$(document).scrollTop())+0]+"Class"]("scale-to-zero");
    }, 500).runAfterDeclare());
    let userData = utils.getLoginData();
    utils.setLoginUI(userData);
    app.userData = userData;
    addEventListener("storage", e => {
        app.userData = utils.getLoginData();
        utils.setLoginUI(app.userData);
        app.postData && app.postData.notFound && app.loadContent();
        app.postData && app.postData.secret && ((!app.userData) || (app.userData.role + 1 < app.postData.secret)) && app.showContent({
            title: 'Oops!',
            subtitle: "You have no access to this post. Please try to <a href='login' onclick='utils.setRedirect(utils.getAbsPath())'" +">Login</a>",
            date: (new Date()).toDateString(),
            tags: ['403'],
            content: '<p>This post has a level beyond you!</p>',
            secret: 0,
            notFound: true
        });
    });
    app.loading = true;
    app.preloaded = true;
    app.onLoad(utils.setHeimu);
    app.postDigest = [];
    app.mainVue = new Vue({
        el: "#main",
        data: {
            utils, app, userData
        }
    });
    if(window.ROSELIA_CONFIG){
        let conf = ROSELIA_CONFIG;
        app.preloaded = true;
        app.postData = conf;
        conf.notFound || history.replaceState({id: conf.current}, "", './post?p='+conf.current);
        conf.notFound || app.processContent();
        conf.notFound && userData && (app.preloaded = false, app.loadContent());
    } else {
        app.preloaded = false;
        app.loadContent();
    }
    
    window.addEventListener('popstate', e => e.state.id && app.loadContent(e.state.id));
    window.addEventListener('keyup', ev => {
        let code = ev.key;
        if(code === 'ArrowLeft') app.shiftPost(1);
        if(code === 'ArrowRight') app.shiftPost(-1);
    });
});