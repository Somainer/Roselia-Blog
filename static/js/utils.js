/**
 * Created by somai on 2017/8/21.
 */
let BLOG_TITLE = 'Roselia-Blog';
let BLOG_MOTTO = 'Do what you want to do, be who you want to be.';
window.utils = {};
utils.BLOG_TITLE = BLOG_TITLE;
utils.BLOG_MOTTO = BLOG_MOTTO;
window.onerror = ()=>true;
utils.getArguments = function () {
    let argStr = window.location.search;
    if(!argStr.length) return {};
    let args = window.location.search.substring(1).split('&');
    let argDict = {};
    args.forEach(function (i) {
        let item = i.split("=");
        argDict[decodeURIComponent(item[0])] = decodeURIComponent(item[1]);
    });
    return argDict;
};

utils.setRedirect = function (url) {
    window.sessionStorage.setItem('redirectURL', url);
};

utils.getRedirect = function () {
    return window.sessionStorage.getItem('redirectURL');
};

utils.cleanRedirect = function () {
    window.sessionStorage.removeItem('redirectURL');
};

utils.setHeimu = () => {
    $(".heimu").mouseover((e) => {
      $(e.target).css("color", "white");
    }).mouseout((e) => {
      $(e.target).css("color", "black");
    });
};

utils.getAbsPath = function () {
    return window.location.pathname + window.location.search;
};

utils.redirectTo = url => window.location.href = url || './';

utils.getLoginData = () => window.localStorage.loginData ? JSON.parse(window.localStorage.loginData):null;

utils.setLoginData = data => window.localStorage.loginData = JSON.stringify(data);

utils.removeLoginData = () => window.localStorage.loginData && window.localStorage.removeItem("loginData");

utils.getPosts = function (callback) {
    let args = {}, login = utils.getLoginData();
    if(login) args.token = login.token;
    $.getJSON('./api/posts', args, function (data) {
        utils.setPosts(data);
        callback && callback(data);
    });
};

utils.getPostsData = () => JSON.parse(window.localStorage.postData||"null");

utils.deleteDraft = () => window.localStorage.removeItem("postDraft");

utils.setPosts = function (data) {
    window.localStorage.postData = JSON.stringify(data);
};

utils.processPosts = function (callback) {
    let post = window.localStorage.postData;
    if(post) callback(JSON.parse(post));
    else utils.getPosts(callback);
    return false;
};
(function(utils, $){
    utils.colorUtils = {
        splitRGB(color){
            return color.match(/\d+/g);
        },
        getYIQ(color){
            let rgb = this.splitRGB(color);
            return ((rgb[0]*299)+(rgb[1]*587)+(rgb[2]*114))/1000;
        },
        getNormalizedTextColor(color, light, dark){
            return this.getYIQ(color) >= 128 ? dark : light;
        },
        apply(option){
            let def={
                changeText: false,
                textColors: {
                    light: "#fff",
                    dark: "#000"
                },
                exclude: ['rgb(0,0,0)'],
                target: "body", text: null
            };
            let opts = $.extend({}, def, option);
            let img = $(opts.selector)[0];
            let self = this;
            this.RGBaster.colors(img, {
                paletteSize: 20,
                exclude: opts.exclude,
                success(colors){
                    let dominant = self.splitRGB(colors.dominant)?colors.dominant:colors.palette.find(color => self.splitRGB(color))||'rgb(255,255,255)';
                    $(opts.target).css({transition: "background-color 1800ms ease"}).css({backgroundColor: dominant});
                    if(opts.changeText){
                        let $text = $(opts.text || opts.target);
                        $text.css({transition: "color 1800ms ease"}).css({color: self.getNormalizedTextColor(dominant,
                            opts.textColors.light, opts.textColors.dark)});
                    }
                }
            });
        }
    };
})(utils, jQuery);
//Import: RGBaster
!function(n){"use strict";var t=function(){return document.createElement("canvas").getContext("2d")},e=function(n,e){var a=new Image,o=n.src||n;"data:"!==o.substring(0,5)&&(a.crossOrigin="Anonymous"),a.onload=function(){var n=t("2d");n.drawImage(a,0,0);var o=n.getImageData(0,0,a.width,a.height);e&&e(o.data)},a.src=o},a=function(n){return["rgb(",n,")"].join("")},o=function(n){return n.map(function(n){return a(n.name)})},r=5,i=10,c={};c.colors=function(n,t){t=t||{};var c=t.exclude||[],u=t.paletteSize||i;e(n,function(e){for(var i=n.width*n.height||e.length,m={},s="",d=[],f={dominant:{name:"",count:0},palette:Array.apply(null,new Array(u)).map(Boolean).map(function(){return{name:"0,0,0",count:0}})},l=0;i>l;){if(d[0]=e[l],d[1]=e[l+1],d[2]=e[l+2],s=d.join(","),m[s]=s in m?m[s]+1:1,-1===c.indexOf(a(s))){var g=m[s];g>f.dominant.count?(f.dominant.name=s,f.dominant.count=g):f.palette.some(function(n){return g>n.count?(n.name=s,n.count=g,!0):void 0})}l+=4*r}if(t.success){var p=o(f.palette);t.success({dominant:a(f.dominant.name),secondary:p[0],palette:p})}})},n.RGBaster=n.RGBaster||c}(utils.colorUtils);
//End Import

(function ($) {
    $(document).ready(function () {
        $('.blog-title').html(BLOG_TITLE);
        $('.blog-motto').html(BLOG_MOTTO);
    });
})(jQuery);
