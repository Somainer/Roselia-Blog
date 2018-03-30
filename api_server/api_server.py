import PipeLine
from flask import Flask, request, send_from_directory, jsonify, render_template, redirect
import json
from tokenProcessor import TokenProcessor
import functools
import PyRSS2Gen
import datetime
from Logger import log
import AuthLogin
import time

from gevent import monkey
from gevent.pywsgi import WSGIServer
monkey.patch_all()

app = Flask(__name__, static_folder='../', static_url_path='')
ppl = PipeLine.PostManager()
acm = PipeLine.ManagerAccount()
token_processor = TokenProcessor()
auth_login = AuthLogin.AuthLogin()
from config import BLOG_INFO, BLOG_LINK, DEBUG, HOST, PORT

def to_json(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return jsonify(func(*args, **kwargs))
        # return json.dumps(func(*args, **kwargs))

    return wrapper

def log_time(item):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            s = time.time()
            res = func(*args, **kwargs)
            log.d(item, "finish in", time.time()-s, "s.")
            return res
        return wrapper
    return decorator

def conn_info():
    ua = request.user_agent
    return {
        "ip": request.access_route[0],
        "browser": ua.browser.capitalize(),
        "os": ua.platform.capitalize()
    }

@app.route('/')
#def mainpage():
#    return app.send_static_file('index.html')


#@app.route('/seo')
def seo_main():
    if acm.is_empty():
        return redirect('/firstrun')
    logged_in = True
    token = request.args.get('token')
    data = None
    if not token:
        logged_in = False
    else:
        state, data = token_processor.get_username(token)
        print(data)
        logged_in = state
    if not logged_in:
        data = {'role': 0}
    tag = request.args.get('tag')
    page = request.args.get('page', 1, int)
    limit = request.args.get('limit', 6, int)
    offset = (page - 1) * limit
    level = logged_in + data['role']
    if tag:
        posts = [i for i in ppl.get_all_brief() if tag.lower() in map(str.lower, i['tags'])]
        total = len(posts)
        pages = 1
    else:
        posts = ppl.get_posts(offset, limit, level)
        total = ppl.get_count(level)
        pages = total // limit + (total % limit > 0)
    user_data = {'username': data['username'], 'role': data['role'], 'token': token} if logged_in else None
    tag = tag.capitalize() if tag else None
    return render_template('index.html', posts=posts, userData=user_data, tag=tag, info=BLOG_INFO, 
        pages={'total': total, "current": page, "pages": pages})

@app.route('/edit')
def edit_page():
    return app.send_static_file("edit.html")

@app.route('/post')
def getpostpage():
    p = request.args.get("p", -1, int)
    logged_in = True
    data = None
    token = request.args.get('token')
    if not token:
        logged_in = False
    else:
        state, data = token_processor.get_username(token)
        print(data)
        logged_in = state
    if not logged_in:
        data = {'role': 0}
    post = ppl.find_post(p) if p >= 0 else None
    level = logged_in + data['role']
    if post and level >= post['secret']:
        post_data = dict(post, prev=ppl.get_prev(p, level), next=ppl.get_next(p, level))
    else:
        post_data = {
            'title': 'Page Not Found',
            'subtitle': "Please check your post-id. Or try to <a href='../login.html' onclick='utils.setRedirect(utils.getAbsPath())'" +">Login</a>",
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
    return render_template("firstrun.html", su_token=su_token, info=BLOG_INFO, user_data=user_data, token=token['token'])


@app.errorhandler(404)
def error_404(error):
    return render_template('error.html', error_code='404 Not Found', error_taunt=error if isinstance(error, str) else "Oops‽ seemed you've drunk. ", 
    path=request.path, link=BLOG_LINK, info=BLOG_INFO, url=request.url, method=request.method), 404

@app.errorhandler(500)
def error_500(error):
    print(error)
    return render_template('error.html', error_code='500 Internal Server Error', error_taunt=error if isinstance(error, str) else "SHHH! That's shame. Do not tell others.",
    path=request.path, link=BLOG_LINK, info=BLOG_INFO, url=request.url, method=request.method), 500


@app.route('/post/<int:p>')
def seo_post(p):
    print("Got an request:", p)
    logged_in = True
    data = None
    token = request.args.get('token')
    if not token:
        logged_in = False
    else:
        state, data = token_processor.get_username(token)
        print(data)
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
            'subtitle': "Please check your post-id. Or try to <a href='../login.html' onclick='utils.setRedirect(utils.getAbsPath())'" +">Login</a>",
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
    username = request.form.get('username')
    old_password = request.form.get('oldPassword')
    new_password = request.form.get('newPassword')
    token = request.form.get('token', '')
    stat, data = token_processor.is_su(token)
    if stat:
        stat = stat and data['su']
    if not all([username, new_password, stat or old_password]):
        return {
            'success': False, 'msg': 'Missing Username or Password'
        }
    if stat:
        status = acm.force_change_password(username, new_password, data.get('su', 0))
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

@app.route('/api/user/remove', methods=['DELETE'])
@to_json
def delete_user():
    form = request.get_json()
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
        print(data)
        logged_in = state
    if not logged_in:
        data = {'role': 0}
    posts = sorted([i for i in ppl.get_all_brief() if (logged_in + data['role'] >= i['secret']) and
                    t.lower() in map(str.lower, i['tags'])],
                   key=lambda x: x['id'])
    user_data = {'username': data['username'], 'role': data['role'], 'token': token} if logged_in else None
    return render_template('index.html', posts=posts, userData=user_data, tag=t.capitalize(), info=BLOG_INFO)

@app.route('/api/post/<int:p>')
@to_json
def get_post(p):
    logged_in = True
    data = None
    token = request.args.get('token')
    if not token:
        logged_in = False
    else:
        state, data = token_processor.get_username(token)
        #print(data)
        logged_in = state
    if not logged_in:
        data = {'role': 0}
    need_markdown = json.loads(request.args.get('markdown', "false").lower())
    post = ppl.find_post(p, need_markdown)
    level = logged_in + data['role']
    if post:
        return dict(post, prev=ppl.get_prev(p, level), next=ppl.get_next(p, level)) if level >= post['secret'] else None
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
        #print(data)
        logged_in = state
    if not logged_in:
        data = {'role': 0}
    level = logged_in + data['role']
    page = request.args.get('page', 1, int)
    limit = request.args.get('limit', 20, int)
    tag = request.args.get('tag')
    offset = (page - 1) * limit
    if tag:
        posts = sorted([i for i in ppl.get_all_brief() if (level >= i['secret']) and
                        tag.lower() in map(str.lower, i['tags'])],
                       key=lambda x: x['id'])
        total = len(posts)
        pages = 1
    else:
        posts = ppl.get_posts(offset, limit, level)
        total = ppl.get_count(level)
        pages = total // limit + (total % limit > 0)
    return {
        'data': posts, 'total': total, 'pages': pages, 'valid': logged_in
    }


@app.route('/login')
def login_page():
    return app.send_static_file('login.html')\

@app.route('/userspace')
def userspace_page():
    return app.send_static_file('userspace.html')


@app.route('/api/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')
    if not all([username, password]):
        return json.dumps({
            'success': False, 'msg': 'Missing Username or Password'
        })
    status, code = acm.check_user(username, password)
    if not status:
        return json.dumps({
            'success': False, 'msg': 'Wrong Username or Password'
        })
    log.v("User logged in successfully!", username=username, role=code)
    return json.dumps({
        'success': True, 'token': TokenProcessor().iss_token(username, code)[1]['token'],
        'role': code
    })

@app.route('/api/login/token', methods=['POST'])
@to_json
def login_token():
    token = request.form.get('token')
    if not token: return {
        'success': False, 'msg': 'Bad Params'
    }
    stat, payload = token_processor.get_username(token)
    return {
        'success': stat, 'payload': payload, 'msg': 'Bad token'
    }


@app.route('/api/remove', methods=['DELETE'])
@to_json
def delete_post():
    form = request.get_json()
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
    ppl.remove_post(pid)
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
    if info.get('role') == 0:
        return {
            'success': False, 'msg': 'role error'
        }
    if pid is None:
        state = ppl.add_post(data, markdown)
    else:
        state = ppl.edit_post(pid, data, markdown)
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
        #print(data)
        logged_in = state
    if not logged_in:
        data = {'role': 0}
    data = sorted([i for k, i in ppl.get_all().items() if logged_in + data['role'] >= i['secret']],
                  key=lambda x: x['id'])
    rss = PyRSS2Gen.RSS2(
        title="Roselia-Blog",
        link=BLOG_LINK,
        description="Do what you want to do, be who you want to be",
        lastBuildDate=datetime.datetime.now() if not len(data) else datetime.datetime.fromtimestamp(data[-1]['time']),
        pubDate=datetime.datetime.now(),
        items=[PyRSS2Gen.RSSItem(
            title=post['title'],
            description=post['subtitle'],
            author='Somainer',
            link="{}post?p={}".format(BLOG_LINK, post['id']),
            guid=PyRSS2Gen.Guid("{}post?p={}".format(BLOG_LINK, post['id'])),
            categories=post['tags'],
            pubDate=datetime.datetime.fromtimestamp(post['time'])
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


if __name__ == '__main__':
    if DEBUG:
        app.run(host='0.0.0.0', threaded=True, debug=DEBUG)
    else:
        log.info("{} ran on {}:{}".format(BLOG_INFO["title"], HOST, PORT))
        http_server = WSGIServer((HOST, PORT), app)
        http_server.serve_forever()
    
