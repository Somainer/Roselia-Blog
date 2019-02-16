#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from flask import Flask, request, send_from_directory, jsonify, render_template, redirect, url_for, abort, make_response
from werkzeug.utils import secure_filename
import json
from tokenProcessor import TokenProcessor
import functools
import PyRSS2Gen
import datetime
from Logger import log
import AuthLogin
import time
import os
from config import BLOG_INFO, BLOG_LINK, DEBUG, HOST, PORT, UPLOAD_DIR
from ImageConverter import ImageConverter
from middleware import verify_token, ReverseProxied, make_option_dict, to_json, require_argument
from urllib.parse import quote

from external_views import register_views
from models.all import database
from controller.UserManager import UserManager
from controller.PostManager import PostManager

# from gevent import monkey
from gevent.pywsgi import WSGIServer

# monkey.patch_all()

app = Flask(__name__, static_folder='../', static_url_path='')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.wsgi_app = ReverseProxied(app.wsgi_app)
# ppl = PipeLine.PostManager()
ppl = PostManager()
# acm = PipeLine.ManagerAccount()
acm = UserManager
token_processor = TokenProcessor()
auth_login = AuthLogin.AuthLogin()
register_views(app)

database.set_app(app).inject()


def log_time(item):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            s = time.time()
            res = func(*args, **kwargs)
            log.d(item, "finish in", time.time() - s, "s.")
            return res

        return wrapper

    return decorator


def conn_info():
    ua = request.user_agent
    return {
        "ip": request.access_route[0],
        "browser": ua.browser and ua.browser.capitalize(),
        "os": ua.platform and ua.platform.capitalize()
    }


if DEBUG:
    @app.route('/__webpack_hmr')
    def npm():
        return redirect('http://localhost:8080/__webpack_hmr')


    @app.route('/<string:path>.js')
    def stjs(path):
        import requests
        response = make_response(requests.get('http://localhost:8080/{}.js'.format(path)).content)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
        return response


    @app.route('/static/fonts/<string:path>')
    def nppm(path):
        import requests
        response = make_response(requests.get('http://localhost:8080/static/fonts/' + path).content)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
        return response


    @app.route('/fonts/<string:path>')
    def npm_font(path):
        import requests
        response = make_response(requests.get('http://localhost:8080/fonts/' + path).content)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
        return response

static_urls = [
    'login', 'userspace', 'me', 'edit', 'add', 'hello', 'timeline'
]

if DEBUG:
    static_urls.append('/')
    static_urls.append('post')
    static_urls.append('post/<string:post>')


    def new_index(*args, **kwargs):
        return render_template('index_vue_dev.html')

else:
    def new_index(*args, **kwargs):
        return render_template('index_vue.html', info=BLOG_INFO, posts=[], pages={'total': 0, "current": 1, "pages": 1})

for u in static_urls:
    app.route('/' + u)(new_index)
    app.route('/' + u + '/')(new_index)

app.route('/userspace/<string:p>')(new_index)


@app.route('/')
# def mainpage():
#    return app.send_static_file('index.html')

# @app.route('/seo')
def seo_main():
    if acm.is_empty():
        return redirect('/hello')
    # return new_index()

    logged_in = True
    token = request.args.get('token')
    data = None
    if not token:
        logged_in = False
    else:
        state, data = token_processor.get_username(token)
        # print(data)
        logged_in = state
    if not logged_in:
        data = {'role': 0}
    tag = request.args.get('tag')
    catalog = request.args.get('catalog')
    page = request.args.get('page', 1, int)
    limit = request.args.get('limit', 6, int)
    offset = (page - 1) * limit
    level = logged_in + data['role']
    posts = ppl.get_posts(offset, limit, level, tag, catalog)
    total = ppl.get_count(level)
    pages = total // limit + (total % limit > 0)
    user_data = {'username': data['username'], 'role': data['role'], 'token': token} if logged_in else None
    tag = tag.capitalize() if tag else None
    return render_template('index_vue.html', posts=posts, userData=user_data, tag=tag, info=BLOG_INFO,
                           pages={'total': total, "current": page, "pages": pages})


@app.route('/edit')
def edit_page():
    return app.send_static_file("edit.html")


@app.route('/post')
@app.route('/post/<string:p>')
@app.route('/post/<string:p>/')
def getpostpage(p=None):
    p = p or request.args.get("p", -1, int)
    logged_in = True
    data = None
    token = request.args.get('token')
    if not token:
        logged_in = False
    else:
        state, data = token_processor.get_username(token)
        # print(data)
        logged_in = state
    if not logged_in:
        data = {'role': 0}
    post = ppl.find_post(p)
    if post:
        p = post['id']
    level = logged_in + data['role']
    if post and level >= post['secret']:
        post_data = dict(post, prev=ppl.get_prev(p, level), next=ppl.get_next(p, level))
    else:
        post_data = {
            'title': 'Page Not Found',
            'subtitle': "Please check your post-id. Or try to Login.",
            'date': datetime.datetime.now().strftime('%B %d, %Y'),
            'tags': ['404'],
            'content': '<p>There might be some problem here. Please check your input.</p>',
            'id': -1,
            'prev': -1,
            'next': -1,
            'secret': 0 if not post else post.get('secret', 0),
            'author': {
                'nickname': ''
            }
        }
    user_data = {'username': data['username'], 'role': data['role'], 'token': token} if logged_in else None
    return render_template('post_vue.html', post=post_data, userData=user_data, info=BLOG_INFO)


@app.route('/api/firstrun')
@to_json
def first_run_api():
    if not acm.is_empty():
        return {
            'success': False,
            'msg': 'User is not empty.'
        }
    user_data = {
        "username": "Master",
        'role': 3
    }
    _, token = token_processor.iss_token(**user_data)
    su_token = token_processor.iss_su_token(user_data['username'], user_data['role'])
    return {
        'success': True,
        'result': dict(user_data, **{
            'token': token['token'],
            'su_token': su_token
        })
    }


@app.route('/firstrun')
def first_run():
    if not acm.is_empty():
        return redirect('/')
    user_data = {
        "username": "Master",
        'role': 3
    }
    _, token = token_processor.iss_token(**user_data)
    su_token = token_processor.iss_su_token(user_data['username'], user_data['role'])
    return render_template("firstrun.html", su_token=su_token, info=BLOG_INFO, user_data=user_data,
                           token=token['token'])


@app.errorhandler(404)
def error_404(error):
    return render_template('error.html', error_code='404 Not Found',
                           error_taunt=error if isinstance(error, str) else "Oops‽ seemed you've drunk. ",
                           path=request.path, link=BLOG_LINK, info=BLOG_INFO, url=request.url,
                           method=request.method), 404


@app.errorhandler(500)
def error_500(error):
    # print(error)
    return render_template('error.html', error_code='500 Internal Server Error',
                           error_taunt=error if isinstance(error, str) else "SHHH! That's shame. Do not tell others.",
                           path=request.path, link=BLOG_LINK, info=BLOG_INFO, url=request.url,
                           method=request.method), 500


@app.route('/post/<int:p>')
def seo_post(p):
    # print("Got an request:", p)
    logged_in = True
    data = None
    token = request.args.get('token')
    if not token:
        logged_in = False
    else:
        state, data = token_processor.get_username(token)
        # print(data)
        logged_in = state
    if not logged_in:
        data = {'role': 0}
    post = ppl.find_post(p)
    level = logged_in + data['role']
    if post and level >= post['secret']:
        post_data = dict(post, prev=ppl.get_prev(p, level), next=ppl.get_next(p, level))
    else:
        post_data = {
            'title': 'Page Not Found',
            'subtitle': "Please check your post-id. Or try to <a href='../login.html' onclick='utils.setRedirect(utils.getAbsPath())'" + ">Login</a>",
            'date': datetime.datetime.now().strftime('%B %d, %Y'),
            'tags': ['404'],
            'content': '<p>There might be some problem here. Please check your input.</p>',
            'id': -1,
            'prev': -1,
            'next': -1,
            'secret': 0 if not post else post.get('secret', 0)
        }
    user_data = {'username': data['username'], 'role': data['role'], 'token': token} if logged_in else None
    return render_template('post.html', post=post_data, userData=user_data, info=BLOG_INFO)


@app.route('/api/user/change', methods=['POST'])
@to_json
def change_password():
    form = request.get_json()
    if not form:
        form = request.form
    username = form.get('username')
    old_password = form.get('oldPassword')
    new_password = form.get('newPassword')
    token = form.get('token', '')
    stat, data = token_processor.is_su(token)
    if stat:
        stat = stat and data['su']
    if not all([username, new_password, stat or old_password]):
        return {
            'success': False, 'msg': 'Missing Username or Password'
        }
    if stat:
        status = acm.force_set_password(username, new_password, data.get('su', 0))
    else:
        status = acm.change_password(username, old_password, new_password)
    if status:
        log.v('Password changed.', username=username, by=data.get('admin') if stat else username, force=stat)
    return {
        'success': status, 'msg': 'Wrong token or expired' if token else 'Wrong password.'
    }


@app.route('/api/user/list')
@to_json
def get_user_list():
    token = request.args.get('token', '')
    stat, data = token_processor.get_username(token)
    if stat:
        stat = stat and data.get('role', 0)
    if not stat:
        return {
            'success': False, 'msg': 'Bad token or role'
        }
    return {
        'success': True, 'data': acm.get_all_user(data.get('role', 0))
    }


@app.route('/api/user/su', methods=['POST'])
@to_json
def get_su_token():
    form = request.get_json()
    if not form:
        form = request.form
    token = form.get('token')
    username = None
    if token:
        stat, info = token_processor.get_username(token)
        if stat:
            username = info['username']
    else:
        username = form.get('username')
    password = form.get('password')
    if not all([username, password]):
        return {
            'success': False, 'msg': 'Missing Username or Password'
        }
    status, code = acm.check_user(username, password)
    if not status or not code:
        return {
            'success': False, 'msg': 'Wrong Username or Password'
        }
    log.v("SuperUser token issued.", username=username, role=code)
    return {
        'success': True, 'token': token_processor.iss_su_token(username, code)
    }


@app.route('/api/user/remove', methods=['DELETE', 'POST'])
@to_json
def delete_user():
    form = request.get_json()
    if not form:
        form = request.form
    username = form.get('username')
    token = form.get('token')
    if not all([username, token]):
        return {
            "success": False, 'msg': 'Bad Request'
        }
    valid, info = token_processor.is_su(token)
    if not valid:
        return {
            'success': False, 'msg': info
        }
    if info.get('su', 0) == 0:
        return {
            'success': False, 'msg': 'role error'
        }
    acm.delete_user(username, info.get('su', 0))
    log.v("User deleted.", username=username, by=info.get('admin'))
    return {
        'success': True
    }


@app.route('/api/user/add', methods=['POST'])
@to_json
def add_user():
    form = request.get_json()
    username = form.get('username')
    password = form.get('password')
    token = form.get('token')
    role = form.get('role', 0)
    try:
        role = int(role)
    except Exception:
        role = -1
    if not all([username, password, token]) or role < 0:
        return {
            "success": False, 'msg': 'Bad Request'
        }
    valid, info = token_processor.is_su(token)
    if not valid:
        return {
            'success': False, 'msg': info
        }
    su_role = info.get('su', 0)
    if su_role == 0 or role >= su_role:
        return {
            'success': False, 'msg': 'role error'
        }
    state = acm.add_user(username, password, role)
    if state:
        log.v("User added.", username=username, by=info.get('admin'), role=role)
    return {
        'success': state, 'msg': 'User Exists'
    }


@app.route('/tag/<string:t>')
def tag_post(t):
    logged_in = True
    token = request.args.get('token')
    data = None
    if not token:
        logged_in = False
    else:
        state, data = token_processor.get_username(token)
        # print(data)
        logged_in = state
    if not logged_in:
        data = {'role': 0}
    page = request.args.get('page', 1, int)
    limit = request.args.get('limit', 6, int)
    offset = (page - 1) * limit
    posts = ppl.get_posts(offset, limit, level=logged_in + data['role'], tag=t)

    user_data = {'username': data['username'], 'role': data['role'], 'token': token} if logged_in else None
    return render_template('index.html', posts=posts, userData=user_data, tag=t.capitalize(), info=BLOG_INFO)


@app.route('/api/post/<int:p>')
@app.route('/api/post-link/<string:p>')
@to_json
def get_post(p):
    logged_in = True
    data = None
    token = request.args.get('token')
    if not token:
        logged_in = False
    else:
        state, data = token_processor.get_username(token)
        # print(data)
        logged_in = state
    if not logged_in:
        data = {'role': 0}
    need_markdown = json.loads(request.args.get('markdown', "false").lower())
    post = ppl.find_post(p, need_markdown)
    level = logged_in + data['role']
    if post:
        return dict(post, prev=ppl.get_prev(post['id'], level), next=ppl.get_next(post['id'], level)) if level >= post['secret'] else None
    return None


@app.route('/api/posts')
@to_json
def all_post():
    logged_in = True
    token = request.args.get('token')
    data = None
    if not token:
        logged_in = False
    else:
        state, data = token_processor.get_username(token)
        # print(data)
        logged_in = state
    if not logged_in:
        data = {'role': 0}
    level = logged_in + data['role']
    page = request.args.get('page', 1, int)
    limit = request.args.get('limit', 20, int)
    tag = request.args.get('tag')
    catalog = request.args.get('catalog')
    offset = (page - 1) * limit
    total = ppl.filter_post(level, tag, catalog).count()
    pages = total // limit + (total % limit > 0)
    posts = ppl.get_posts(offset, limit, level, tag, catalog)
    return {
        'data': posts, 'total': total, 'pages': pages, 'valid': logged_in
    }


@app.route('/login')
def login_page():
    return app.send_static_file('login.html')


@app.route('/userspace')
def userspace_page():
    return app.send_static_file('userspace.html')


@app.route('/api/login', methods=['POST'])
@to_json
def login():
    form = request.get_json()
    if not form:
        form = request.form
    username = form.get('username')
    password = form.get('password')
    if not all([username, password]):
        return {
            'success': False, 'msg': 'Missing Username or Password'
        }
    status, code = acm.check_user(username, password)
    if not status:
        return {
            'success': False, 'msg': 'Wrong Username or Password'
        }
    need_two_factor = acm.has_totp(username)
    if need_two_factor:
        login_code = form.get('code')
        if not login_code or not acm.check_totp(username, login_code):
            return {
                'success': False,
                'msg': '{} two step auth.'.format('Wrong' if login_code else 'Missing'),
                'totp': True
            }
    log.v("User logged in successfully!", username=username, role=code)
    return {
        'success': True, 'token': token_processor.iss_token(username, code)[1]['token'],
        'role': code,
        'rftoken': token_processor.iss_rf_token(username, code)
    }


@app.route('/api/login/token', methods=['POST'])
@to_json
def login_token():
    form = request.get_json()
    if not form:
        form = request.form
    token = form.get('token')
    if not token:
        return {
            'success': False, 'msg': 'Bad Params'
        }
    stat, payload = token_processor.get_username(token)
    return {
        'success': stat, 'payload': payload, 'msg': 'Bad token'
    }


@app.route('/api/login/token/refresh', methods=['POST'])
@to_json
def refresh_token():
    form = request.get_json()
    if not form:
        form = request.form
    token = form.get('token')
    stat, payload = token_processor.refresh_token(token)
    if stat:
        return {
            'success': True,
            'token': payload['token']
        }
    return {
        'success': False,
        'msg': payload
    }


@app.route('/api/remove', methods=['DELETE', 'POST'])
@to_json
def delete_post():
    form = request.get_json()
    if not form:
        form = request.form
    pid = form.get('postID')
    token = form.get('token')
    valid, info = token_processor.get_username(token)
    if not valid:
        return {
            'success': False, 'msg': info
        }
    if info.get('role') == 0:
        return {
            'success': False, 'msg': 'role error'
        }
    ppl.remove_post(pid, info.get('role'))
    log.v("Post deleted.", pid=pid)
    return {
        'success': True
    }


@app.route('/api/add', methods=['POST'])
@to_json
def add_edit_post():
    form = request.get_json()
    if not form:
        form = request.form
    pid = form.get('postID')
    data = form.get('data')
    token = form.get('token')
    markdown = form.get('markdown', 0)
    if not all([data, token]):
        return {
            'success': False, 'msg': 'bad request'
        }
    valid, info = token_processor.get_username(token)
    if not valid:
        return {
            'success': False, 'msg': info
        }
    if info.get('role', 0) == 0 or info.get('role', 0) + 1 < data.get('secret', 0):
        return {
            'success': False, 'msg': 'role error'
        }
    if not pid:
        state = ppl.add_post(data, info['username'], markdown)
    else:
        state = ppl.edit_post(pid, data, info.get('role', 0), markdown)
    return {
        'success': state
    }


@app.route('/api/oauth/authorize', methods=['POST'])
@to_json
def authorize():
    form = request.get_json()
    if not form:
        form = request.form
    app_token = form.get('app_token', '')
    user_token = form.get('user_token', '')
    if not all([app_token, user_token]):
        return {
            'success': False, 'msg': 'bad request'
        }
    valid, info = token_processor.get_username(user_token)

    if not valid:
        return {
            'success': False, 'msg': info
        }
    stat, token = token_processor.iss_oauth_token(info.get('username'), info.get('role'), app_token)
    return {
        'success': stat, 'token': token, 'msg': token, 'username': info.get("username")
    }


@app.route('/api/oauth/get')
@to_json
def get_infos():
    token = request.args.get('token', '')
    stat, info = token_processor.app_token_decode(token)
    return {
        'success': stat, 'info': info
    }


@app.route('/api/rss')
def rss_feed():
    logged_in = True
    token = request.args.get('token')
    data = None
    if not token:
        logged_in = False
    else:
        state, data = token_processor.get_username(token)
        # print(data)
        logged_in = state
    if not logged_in:
        data = {'role': 0}
    level = logged_in + data['role']
    data = ppl.get_all_posts(level)
    rss = PyRSS2Gen.RSS2(
        title=BLOG_INFO['title'],
        link=BLOG_LINK,
        description=BLOG_INFO['motto'],
        lastBuildDate=datetime.datetime.now() if not len(data) else data[-1]['last_edit'],
        pubDate=datetime.datetime.now(),
        items=[PyRSS2Gen.RSSItem(
            title=post['title'],
            description=post['subtitle'],
            author=post['author']['nickname'],
            link="{}post/{}".format(BLOG_LINK, post['display_id']) if post['display_id'] else '{}post?p={}'.format(
                post['id']),
            guid=PyRSS2Gen.Guid(
                "{}post/{}".format(BLOG_LINK, post['display_id']) if post['display_id'] else '{}post?p={}'.format(
                    post['id'])),
            categories=post['tags'],
            pubDate=post['created']
        ) for post in data]

    )
    return rss.to_xml('utf-8'), 201, {'Content-Type': 'application/xml'}


@app.route("/api/login/code/gen", methods=["GET", "POST"])
@to_json
def gen_code():
    return {
        "success": True,
        "code": auth_login.gen_random_token(conn_info())
    }


@app.route("/api/login/code/scan/<int:code>", methods=["POST"])
@to_json
def scan_code(code):
    form = request.get_json()
    if not form:
        form = request.form
    token = form.get("token", "")

    def hndl_code():
        if not code:
            return False, "No code"
        if not token:
            return False, "No token"
        vaild, user = token_processor.get_username(token)
        if not vaild:
            return False, "Invalid token"
        stat, info = auth_login.get_code(code)
        if not stat:
            return False, info
        auth_login.set_code(code, user)
        conn = auth_login.conns.get(code)
        return True, conn

    succ, info = hndl_code()
    return {
        "success": succ,
        "msg": info
    }


@app.route("/api/login/code/confirm/<int:code>", methods=["POST"])
@to_json
def confirm_code(code):
    form = request.get_json()
    if not form:
        form = request.form
    token = form.get("token", "")
    succ, info = auth_login.get_code(code)
    valid, token_user = token_processor.get_username(token)

    def handler():
        if not succ:
            return False, info
        if not valid:
            return False, token_user
        user = info.get("user", {})
        username = user.get("username", "")
        role = user.get("role", 0)
        if username != token_user.get("username"):
            return False, "Wrong user"
        auth_login.confirm_login(code)
        return True, "Confirmed"

    succ, pld = handler()
    return {
        "success": succ,
        "data": pld
    }


@app.route("/api/login/code/<int:code>", methods=["POST"])
@to_json
def query_code(code):
    succ, info = auth_login.get_code(code)

    def handler():
        if not succ:
            return False, info
        user = info.get("user", {})
        res = {
            "username": user.get("username", ""),
            "role": user.get("role", 0)
        }
        if info.get("confirmed"):
            _, t = token_processor.iss_token(res["username"], res["role"])
            res["token"] = t["token"]
            auth_login.pop_code(code)
        return True, res

    succ, pld = handler()
    return {
        "success": succ,
        "data": pld
    }


@app.route("/api/login/code/info/<int:code>")
@to_json
def getlkdfsja(code):
    _, info = auth_login.get_code(code)
    return {
        "info": info
    }


@app.route('/404')
def need_404():
    return error_404("You required a 404, make you happy.")


@app.route('/500')
def need_500():
    return error_500("You required a 500, make you happy.")


@app.route("/api/conn")
@to_json
def get_inform():
    return conn_info()


@app.route('/pic/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)


@app.route('/api/pic/upload', methods=['POST'])
@to_json
def upload_pic():
    file = request.files['file']
    token = request.form.get('token', '')
    convert = request.form.get('to')
    status, msg = token_processor.get_username(token)
    if status and not msg['role']:
        status = False
        msg = 'No Access'
    if status:
        msg = ''
        if file and file.filename.split('.')[-1].lower() in {'jpg', 'jpeg', 'png', 'bmp', 'webp', 'gif'}:
            filename = secure_filename(file.filename)
            if not os.path.exists(UPLOAD_DIR):
                os.mkdir(UPLOAD_DIR)
            filename = datetime.datetime.now().strftime("Upload_%Y%m%d%H%M%S_") + filename
            filename = ImageConverter(file, filename, convert).save(UPLOAD_DIR)
            return {
                'success': True, 'picURL': url_for('uploaded_file', filename=filename), 'msg': ''
            }
        else:
            msg += 'File Not Supported'
    return {
        'success': False, 'picURL': "", 'msg': msg
    }


@app.route('/api/pic/list')
@to_json
@verify_token(1)
def get_list(username, role):
    file_list = [x for x in os.listdir(UPLOAD_DIR) if os.path.isfile(os.path.join(UPLOAD_DIR, x))]
    return {
        'success': True,
        'result': [{
            'url': url,
            'fileName': name
        } for name, url in zip(file_list, map(lambda x: url_for('uploaded_file', filename=x), file_list))]
    }


@app.route('/api/pic/remove', methods=['POST'])
@to_json
@verify_token(1, True)
def delete_image(username, role):
    form = request.get_json()
    if not form:
        form = request.form
    file_name = form.get('fileName')
    if not file_name:
        return {
            'success': False,
            'msg': 'Missing Filename'
        }
    secure = secure_filename(file_name)
    full_path = os.path.join(UPLOAD_DIR, secure)
    success = os.path.exists(full_path)
    if success:
        os.remove(full_path)
    msg = "DO NOT PLAY TRICKS." if file_name != secure else '' if success else 'File Not Found'
    return {
        'success': success,
        'msg': msg
    }


from oauth.adapters import adapters as oauth_adapters


@app.route('/api/login/oauth/adapters')
@to_json
def get_adapters_list():
    return {
        'success': True,
        'result': list(oauth_adapters.keys())
    }


@app.route('/api/login/oauth/<string:third>/url')
@to_json
def get_oauth_url(third):
    adp = oauth_adapters.get(third.lower())
    base = request.args.get('base', '')
    redirection = request.args.get('redirect', '')
    if not adp:
        return {
            'success': False,
            'msg': 'Adapter not found'
        }
    return {
        'success': True,
        'result': adp.get_uri() + '&redirect_uri=' + BLOG_LINK[:-1] + quote(
            url_for('oauth_callback', third=third, base=base, redirect=redirection))
    }


@app.route('/api/oauth/bind/<string:third>/url')
@verify_token(0)
@to_json
def get_oauth_bind_url(third, username, role):
    adp = oauth_adapters.get(third)
    if not adp:
        return {
            'success': False,
            'msg': 'Adapter not found'
        }
    return {
        'success': True,
        'result': adp.get_uri() + '&redirect_uri=' + BLOG_LINK[:-1] + quote(
            url_for('oauth_callback', username=username, third=third, type='bind')
        )
    }


@app.route('/api/login/oauth/<string:third>/callback')
def oauth_callback(third):
    adp = oauth_adapters.get(third.lower())
    code = request.args.get('code')
    base = request.args.get('base')
    redirection = request.args.get('redirect')
    typ = request.args.get('type', '')

    if typ == 'bind':
        return redirect(url_for('oauth_bind', third=third, **request.args))

    def login_uri(token):
        if base:
            return '{}?token={}{}'.format(base, token, '&redirect=' + quote(redirection) if redirection else '')
        return url_for('login_page', **make_option_dict(token=token, redirect=redirection))

    if not adp or not code:
        return redirect(base or url_for('seo_main'))
    return adp.login_payload(code).map(lambda token: redirect(login_uri(token))).get_or(
        redirect(base or url_for('seo_main'))
    )


@app.route('/api/oauth/bind/<string:username>/<string:third>/callback')
def oauth_bind(username, third):
    adp = oauth_adapters.get(third.lower())
    code = request.args.get('code')
    if not adp or not code:
        return redirect('/userspace/oauth-accounts')
    adp.add_user(username, code)

    return redirect('/userspace/oauth-accounts?succeed=' + third)


def run_server():
    if DEBUG:
        app.run(host='0.0.0.0', threaded=True, debug=DEBUG)
    else:
        log.info("{} ran on {}:{}".format(BLOG_INFO["title"], HOST, PORT))
        http_server = WSGIServer((HOST, PORT), app)
        http_server.serve_forever()


if __name__ == '__main__':
    run_server()
