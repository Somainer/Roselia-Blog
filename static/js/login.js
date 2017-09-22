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
    new Vue({
        el: '#content',
        data: app
    });
    if(window.localStorage.loginData){
        Materialize.toast("Logged out!", 3000);
        window.localStorage.removeItem("loginData");
    }
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
    $.post('./api/login',{
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
        utils.cleanRedirect();
        utils.redirectTo(redirectURL);
    });

};
