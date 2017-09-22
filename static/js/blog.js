/**
 * Created by somai on 2017/8/15.
 */
var resizer = function () {
    //document.getElementsByClassName('parallax-container')[0].style.minHeight = window.innerHeight - document.getElementById('mobile-nav').style.height + "px";
    //$('.parallax-container').animate({height: (window.innerHeight*0.618 - $('#mobile-nav').height()) + "px"});
    $('.parallax-container').css({minHeight: "100%"});
    $('#main-pic').animate({width: (window.innerWidth)});
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
    history.pushState({}, "", './?page='+page);
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

    get_data.limit = 2;
    $.ajax({
        type: "GET",
        url: "./api/posts",
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
        url: "./api/remove",
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

app.setScrollFire = function () {
    Materialize.scrollFire([{
        selector: "#load-new",
        offset: 0,
        callback: e => {
            Materialize.toast("Loading...");
            window.location.href = '#';
            app.setScrollFire();
        }
    }]);
};

$(document).ready(function () {
    let userData = utils.getLoginData();
    $(".button-collapse").sideNav();
    $('.parallax').parallax();
    resizer();
    $(window).resize(resizer);
    if(userData){
        $(".username").html(userData.username).attr('href', './userspace.html');
    }
    $(".modal").modal();
    app.getPosts();
    $(".dropdown-button").dropdown();
    $(window).scroll(function(){
      let w_height = $(window).height();
      let scroll_top = $(document).scrollTop();
      if(scroll_top > w_height){
          $(".gotop").fadeIn(500);
        }else{
          $(".gotop").fadeOut(500);
      }
    });
});