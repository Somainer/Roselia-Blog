/**
 * Created by somai on 2017/8/18.
 */


window.app = {};


app.useMarkdown = true;

app.makeRedirect = function (from) {
    utils.setRedirect(utils.getAbsPath());
    window.location.href = "./" + from;
};

$(document).ready(function () {
    //resizer();
    //$(window).resize(resizer);
    $(".button-collapse").sideNav();
    app.loading = true;
    app.uploadedImages = [];
    let userData = utils.getLoginData();
    app.userData = userData;
    if (!userData) {
        $("#content").fadeOut();
        Materialize.toast("Please login first.");
        setTimeout(function () {
            app.makeRedirect('login');
        }, 2000);
    }
    if (!userData.role) {
        $("#content").fadeOut();
        Materialize.toast("You are not supposed to do this.", 2000);
        setTimeout(function () {
            window.location.href = './';
        }, 2000);
    }
    addEventListener("storage", e => {
        e.key === "loginData" && (e.newValue || app.makeRedirect("login"));
    });
    utils.setLoginUI();
    $(".chips").material_chip();

    //app.mdEdit = new SimpleMDE();
    app.postData = {title: ""};
    app.mainVue = new Vue({
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
    window.onbeforeunload = app.saveDraft.bind(app);
    $('#delete-post').modal();
    $('#tags').on('chip.add', function (e, chip) {
        chip.tag = chip.tag.replace(/ /g, '-');
    });
    let fileEv = document.getElementById('upload-img-file-name');
    fileEv.addEventListener('dragenter', e => {
        e.preventDefault();
        $("#upload-img-file-name").val("Yes ♂ Here!");
    });
    fileEv.addEventListener('dragleave', e => {
        e.preventDefault();
        $("#upload-img-file-name").val("Drag & Drop");
    });
    fileEv.addEventListener('drop', e => {
        e.stopPropagation();
        e.preventDefault();
        let file = e.dataTransfer.files[0];
        if (!file) return;
        if (!file.type.startsWith('image')) {
            $("#upload-img-file-name").val("No! Not that!");
            return;
        }
        app.doUploadImage(file);
    });
});

app.getPostNum = () => utils.getArguments().post || -1;

app.operationType = function () {
    return app.getPostNum() > -1;
};

app.operationName = function () {
    return app.operationType() ? "Edit" : "Add";
};

app.preload = function () {
    let pid = app.getPostNum();
    $(".chips-initial").material_chip();
    let loaded = app.loadDraft();
    if (!loaded) {
        if (pid === -1) {
            app.mdEdit ? app.mdEdit.value("") : (app.mdEdit = new SimpleMDE());
        } else {
            app.loadContent(pid, app.showContent);
        }
    }
    app.loading = false;
};

app.editRawHTML = function (btn) {
    let pid = app.getPostNum();
    pid > 0 && app.loadContent(pid, app.showContent, false);
    $(btn).fadeOut();
};

app.loadContent = function (post_num, callback, markdown = true) {
    let bar = new AdvBar;
    bar.startAnimate();
    utils.fetchJSON(utils.apiFor("post", post_num), "GET", {markdown: markdown}).then(function (data) {
        if (data === 'null') data = null;
        app.postData = data;
        app.useMarkdown = markdown;
        callback(data);
    }).then(bar.stopAnimate.bind(bar), bar.abort.bind(bar));
};

app.showContent = function (data) {

    if (!data) {
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
    app.mdEdit ? app.mdEdit.value(data.content) : (app.mdEdit = new SimpleMDE({
        element: $("#post-content")[0],
        initialValue: data.content
    }));
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
    if (app.operationType()) req.postID = parseInt(app.getPostNum());
    return req;
};

app.saveDraft = function () {
    window.localStorage.postDraft = JSON.stringify({
        data: app.makeForm(),
        postID: app.getPostNum(),
        markdown: $("#markdown")[0].checked,
        uploadedImages: this.uploadedImages
    });
    Materialize.toast("Draft Saved!", 2000);
};

app.loadDraft = function () {
    var draft = window.localStorage.postDraft;
    if (draft) {
        draft = JSON.parse(draft);
        if (draft.postID === app.getPostNum()) {
            app.uploadedImages = draft.uploadedImages || [];
            app.showContent(draft.data);
            if (draft.markdown) $("#markdown")[0].checked = true;
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
    let bar = new AdvBar;
    bar.startAnimate();
    $.ajax({
        type: "POST",
        url: utils.apiFor("add"),
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(app.makeRequest(app.makeForm())),
        success: function (data) {
            //data = JSON.parse(data);
            if (data.success) {
                Materialize.toast("Success!", 2000);
                bar.stopAnimate();
                window.location.href = './';
                app.deleteDraft();
            } else {
                bar.abort();
                if (data.msg === 'expired') {
                    utils.refreshToken().then(_ => app.doRequest(), function () {
                        app.saveDraft();
                        utils.notify('Token Expired!', 2000);
                        setTimeout(function () {
                            app.makeRedirect('login');
                        }, 2000);
                    });
                } else {
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
    if (!(userData && userData.role)) {
        Materialize.toast("You are not supposed to do this.", 2000);
        return;
    }
    app.loading = true;
    $.ajax({
        type: "DELETE",
        url: utils.apiFor("remove"),
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({postID: pid, token: userData.token}),
        success: function (data) {
            //console.log(data);
            //data = JSON.parse(data);
            if (data.success) {
                Materialize.toast("Success!", 2000);
                window.location.href = './';
            } else {
                if (data.msg === 'expired') {
                    Materialize.toast('Token Expired!', 2000, "", function () {
                        app.makeRedirect('login', window.location.href);
                    });
                } else {
                    Materialize.toast(data.msg);
                }
            }
            app.loading = false;
        },
        error: function () {
            app.loading = false;
            Materialize.toast("Network Error!", 2000);
        }
    })
};


app.uploadImage = function () {
    let uploadImage = $("#upload-img")[0].files[0];
    return this.doUploadImage(uploadImage);
};

app.doUploadImage = function (uploadImage) {
    let convertToWebp = $("#convert-box")[0].checked;
    if (!uploadImage) return utils.notify('No Image Selected!');
    let formData = new FormData();
    if (convertToWebp) formData.append('to', 'webp');
    formData.append('file', uploadImage);
    formData.append('token', utils.getLoginData().token);
    let bar = new AdvBar;
    bar.startAnimate();
    app.loading = true;
    return utils.ajaxPromised({
        url: utils.apiFor('pic', 'upload'),
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
    }).then(data => {
        if (!data.success) {
            return Promise.reject(data.msg);
        }
        bar.stopAnimate();
        app.uploadedImages.push(data.picURL);
        $("#upload-img").val("");
        $("#upload-img-file-name").val("Drag & Drop");
    }).catch(reason => {
        bar.abort();
        utils.notify(reason || 'Network Error!');
        $("#upload-img-file-name").val("Whoops! :(");
    }).finally(_ => app.loading = false);
};

app.deleteUploadedImage = function (fileName) {
    if (!this.uploadedImages.includes(fileName)) return;
    let bar = new AdvBar;
    bar.startAnimate();
    utils.fetchJSONWithSuccess(utils.apiFor('pic', 'remove'), "POST", {fileName: fileName.split('/').pop()}).then(data => {
        bar.stopAnimate();
        app.uploadedImages.splice(app.uploadedImages.indexOf(fileName), 1);
    }).catch(msg => {
        utils.notify(msg);
        bar.abort();
        msg && msg === 'File Not Found' && app.uploadedImages.splice(app.uploadedImages.indexOf(fileName), 1);
    });
};

app.setImageAsPicture = function (url) {
    $("#img").val(url).focus();
};

app.insertToContent = function (url) {
    let template = app.useMarkdown ? `![](${url})` : `<img src="${url}" />`;
    app.mdEdit.codemirror.replaceRange(template, app.mdEdit.codemirror.getCursor());
};