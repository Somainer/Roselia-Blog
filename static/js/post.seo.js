/**
 * Created by somai on 2017/9/4.
 */
var resizer = function () {
    //document.getElementsByClassName('parallax-container')[0].style.minHeight = window.innerHeight - document.getElementById('mobile-nav').style.height + "px";
    $('.parallax-container').css({height: (window.innerHeight - $('#mobile-nav').height())*0.618 + "px"});
    $('#main-pic').css({width: (window.innerWidth)});
    //document.getElementById("homura").width = window.innerWidth;
};
window.app = {};
app.getPostNum = () => utils.getArguments().p || -1;

$(document).ready(function () {
    $(".button-collapse").sideNav();
    $('.parallax').parallax();
    resizer();
    $(window).resize(resizer);
    $(".username").attr('onclick', 'utils.setRedirect(utils.getAbsPath())');
    utils.setHeimu();
    $("#content").find('img').each(function (i, item) {
            $(item).addClass('responsive-img');
    });
    $("#content").find('p').each(function (i, item) {
        $(item).addClass('flow-text');
    });
});