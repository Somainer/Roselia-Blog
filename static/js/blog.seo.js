/**
 * Created by somai on 2017/9/4.
 */
window.app = {
    deletePost(pid){
        let userData = utils.getLoginData();
        if(!(userData && userData.role)){
            Materialize.toast("You are not supposed to do this.", 2000);
            return;
        }
        $("#post-"+pid).fadeOut();
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
                    Materialize.toast("Success!", 2000);
                }else{
                    $("#post-"+pid).fadeIn();
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
                $("#post-"+pid).fadeIn();
                Materialize.toast("Network Error!", 2000);
            }
        });
    },
    resizer() {
        $('.parallax-container').css({height: (window.innerHeight*0.618 - $('#mobile-nav').height()) + "px"});
        $('#main-pic').animate({width: (window.innerWidth)});
    }
};
$(document).ready(function () {
    $(".button-collapse").sideNav();
    $('.parallax').parallax();
    app.resizer();
    $(window).resize(app.resizer);
    $(".modal").modal();
});