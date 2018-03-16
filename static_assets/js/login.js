/**
 * Created by somai on 2017/8/17.
 */

var resizer = function () {
    //document.getElementsByClassName('parallax-container')[0].style.minHeight = window.innerHeight - document.getElementById('mobile-nav').style.height + "px";
    //$('#content').css('height', (window.innerHeight - $('#mobile-nav').height()) + "px");
    //document.getElementById("homura").width = window.innerWidth;
};
$(document).ready(function () {
    $(".button-collapse").sideNav();
    resizer();
    $(window).resize(resizer);

    app.loading = false;
    app.message = window.sessionStorage.message;
    app.metaInfo = utils.getBlogMeta();
    new Vue({
        el: '#content',
        data: {
            app
        }
    });
    if(window.localStorage.loginData){
        Materialize.toast("Logged out!", 3000);
        window.localStorage.removeItem("loginData");
    }
    addEventListener("storage", e => {
        e.key === "loginData" && e.newValue && utils.redirectTo(utils.getRedirect());
    });
    $.ajaxSetup({
        error: function () {
            app.loading = false;
            shock('#login-form');
            Materialize.toast("Connection error.", 3000);
        }
    });

    $("#username").keypress(function (e) {
        if(e.keyCode === 13 && $("#username").val()){//enter
            $("#password")[0].focus();
        }
    })[0].focus();
    $("#password").keypress(function (e) {
        if(e.keyCode === 13){//enter
            $("#login-button").click();
        }
    });
    window.onbeforeunload = app.cleanUp;
    let token = utils.getArguments().token;
    token&&app.tokenLogin(token);
});

function shock(obj) {
    for (let i = 1; i < 6; i++) {
        $(obj).animate({
            'left': '-=15'
        }, 3, function() {
            $(this).animate({
                'left': '+=30'
            }, 3, function() {
                $(this).animate({
                    'left': '-=15'
                }, 3, function() {

                });
            });
        });
    }
}
window.app = {};
app.loading = true;
app.loginCode = "";
app.scannedUsername = "";
app.login = function () {
    app.loading = true;
    let username = $("#username").val();
    let password = $("#password").val();
    if(!(username && password)){
        shock('#login-form');
        app.loading = false;
        return false;
    }
    console.log($("#login-data").serialize());
    $.post(utils.apiFor('login'),{
        username: username, password: password
    } , function (data, stat) {
        data = $.parseJSON(data);
        if(!(data.success)){
            shock('#login-form');
            Materialize.toast(data.msg, 2000);
            app.loading = false;
            return;
        }
        utils.setLoginData({
            username: username, token: data.token, role: data.role
        });
        let redirectURL = utils.getRedirect();
        utils.redirectTo(redirectURL);
        app.cleanUp();
    });

};
app.cleanUp = function () {
    utils.cleanRedirect();
    window.sessionStorage.removeItem("message");
};

app.tokenLogin = function(token){
    this.loading = true;
    $.post(utils.apiFor('login','token'),{
        token
    } , function (data, stat) {
        if(!(data.success)){
            shock('#login-form');
            Materialize.toast(data.msg, 2000);
            app.loading = false;
            return;
        }
        utils.setLoginData({
            username: data.payload.username, token: token, role: data.payload.role
        });
        let redirectURL = utils.getRedirect();
        utils.redirectTo(redirectURL);
        app.cleanUp();
    });
};

app.getLoginCode = function () {
    return utils.fetchJSON(utils.apiFor("login", "code", "gen")).then(data => {
        return data.code;
    }).catch(_ => app.loginCode ="Please retry.");
};

app.codeLogin = function () {
    app.loading = true;
    app.loginCode = "Loading...";
    this.getLoginCode().then(code => app.loginCode = code).then(app.codeLoginTriggers);
};

app.codeLoginTriggers = function () {
    app.codeChecker = setInterval(function () {
        if(!app.loginCode) return;
        utils.fetchJSON(utils.apiFor("login", "code", app.loginCode), "POST", {}, false).then(
            data => {
                if(!data.success){
                    return;
                }
                let payload = data.data;
                if(payload.username) {
                    app.scannedUsername = payload.username;
                }
                if(payload.token){
                    utils.setLoginData({
                        username: payload.username,
                        role: payload.role,
                        token: payload.token
                    });
                    let redirectURL = utils.getRedirect();
                    utils.redirectTo(redirectURL);
                    app.cleanUp();
                }
            }
        ).catch(_ => true);
    }, 3000);
    setTimeout(() => {
        app.codeLoginCleanUp();
    }, 60000);
};

app.codeLoginCleanUp = function () {
    this.codeChecker && clearInterval(this.codeChecker);
    this.loading = false;
    this.loginCode = "";
    this.scannedUsername = "";
};
