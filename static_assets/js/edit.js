/**
 * Created by somai on 2017/8/18.
 */


window.app = {};

app.makeRedirect = function (from) {
    utils.setRedirect(utils.getAbsPath());
    window.location.href = "./" + from;
};

$(document).ready(function () {
    //resizer();
    //$(window).resize(resizer);
    $(".button-collapse").sideNav();
    app.loading = true;
    let userData = utils.getLoginData();
    app.userData = userData;
    if(!userData){
        $("#content").fadeOut();
        Materialize.toast("Please login first.");
        setTimeout(function () {
            app.makeRedirect('login');
        }, 2000);
    }
    if(!userData.role){
        $("#content").fadeOut();
        Materialize.toast("You are not supposed to do this.", 2000);
        setTimeout(function () {
            window.location.href = './';
        }, 2000);
    }
    addEventListener("storage", e => {
        e.key === "loginData" && (e.newValue || app.makeRedirect("login"));
    });
    $(".username").html(userData.username);
    $(".chips").material_chip();

    //app.mdEdit = new SimpleMDE();
    app.postData = {title: ""};
    new Vue({
        el: "#content",
        data: {
            app: app
        }
    });
    $.ajaxSetup({
        error: function () {
            app.loading = false;
            Materialize.toast("Connection error.", 3000);
        }
    });

    app.preload();
    window.onbeforeunload = app.saveDraft;
    $('#delete-post').modal();
    $('#tags').on('chip.add', function(e, chip){
        chip.tag = chip.tag.replace(/ /g, '-');
    });
});

app.getPostNum = () => utils.getArguments().post || -1;

app.operationType = function () {
    return app.getPostNum() > -1;
};

app.operationName = function () {
    return app.operationType()?"Edit":"Add";
};

app.preload = function () {
    let pid = app.getPostNum();
    $(".chips-initial").material_chip();
    let loaded = app.loadDraft();
    if(!loaded){
        if(pid === -1){
        app.mdEdit = new SimpleMDE();
        }else{
            app.loadContent(pid, app.showContent);
        }
    }
    app.loading = false;
};

app.loadContent = function (post_num, callback) {
    utils.fetchJSON(utils.apiFor("post", post_num), "GET", {markdown: true}).then(function (data) {
        if(data === 'null') data = null;
        app.postData = data;
        callback(data);
    });
};

app.showContent = function (data) {

    if(!data){
        window.location.href = './edit';
        return;
    }
    document.title = "Edit post " + data.title;
    $("#title").val(data.title).focus();
    $("#subtitle").val(data.subtitle).focus();
    $("#img").val(data.img).focus();
    $(".chips-initial").material_chip({
        data: data.tags.map(function (tag) {
            return {tag: tag};
        })
    });
    $("#secret").val(data.secret);
    //$("#post-content").val(data.content).trigger('autoresize');
    app.mdEdit = new SimpleMDE({
        element: $("#post-content")[0],
        initialValue: data.content
    });
    $("#title").focus();
    app.loading = false;
    //app.mdEdit.value(data.content);
};
app.makeForm = function () {
    var data = {
        title: $("#title").val(),
        subtitle: $("#subtitle").val(),
        img: $("#img").val(),
        tags: $('.chips-initial').material_chip('data').map(function (tag) {
            return tag.tag;
        }),
        content: app.mdEdit.value(),
        secret: parseInt($("#secret").val())
    };
    return data;
};

app.makeRequest = function (data) {
    var req = {
        data: data,
        token: utils.getLoginData().token,
        markdown: $("#markdown")[0].checked
    };
    if(app.operationType()) req.postID = parseInt(app.getPostNum());
    return req;
};

app.saveDraft = function () {
    window.localStorage.postDraft = JSON.stringify({
        data: app.makeForm(), postID: app.getPostNum(), markdown: $("#markdown")[0].checked
    });
    Materialize.toast("Draft Saved!", 2000);
};

app.loadDraft = function () {
    var draft = window.localStorage.postDraft;
    if(draft){
        draft = JSON.parse(draft);
        if(draft.postID === app.getPostNum()){
            app.showContent(draft.data);
            if(draft.markdown) $("#markdown")[0].checked = true;
            Materialize.toast("Draft loaded!", 2000);
            //window.localStorage.removeItem("postDraft");
            return true;
        }
    }
    return false;
};

app.deleteDraft = function () {
    window.localStorage.removeItem('postDraft');
};

app.doRequest = function () {
    app.loading = true;
    $.ajax({
        type: "POST",
        url: utils.apiFor("add"),
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(app.makeRequest(app.makeForm())),
        success: function (data) {
            console.log(data);
            //data = JSON.parse(data);
            if(data.success){
                Materialize.toast("Success!", 2000);
                app.deleteDraft();
                window.location.href = './';
            }else{
                if(data.msg === 'expired'){
                    app.saveDraft();
                    Materialize.toast('Token Expired!', 2000);
                    setTimeout(function () {
                        app.makeRedirect('login');
                    }, 2000);
                }else{
                    Materialize.toast(data.msg);
                }
            }
            app.loading = false;
        }
    });
};

app.deletePost = function (pid) {
    pid = pid || app.getPostNum();
    let userData = utils.getLoginData();
    if(!(userData && userData.role)){
        Materialize.toast("You are not supposed to do this.", 2000);
        return;
    }
    app.loading = true;
    $.ajax({
        type: "DELETE",
        url: utils.apiFor("remove"),
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({postID: pid, token:userData.token}),
        success: function (data) {
            //console.log(data);
            //data = JSON.parse(data);
            if(data.success){
                Materialize.toast("Success!", 2000);
                window.location.href = './';
            }else{
                if(data.msg === 'expired'){
                    Materialize.toast('Token Expired!', 2000, "", function () {
                        app.makeRedirect('login', window.location.href);
                    });
                }else{
                    Materialize.toast(data.msg);
                }
            }
            app.loading = false;
        },
        error:function () {
            app.loading = false;
            Materialize.toast("Network Error!", 2000);
        }
    })
};
