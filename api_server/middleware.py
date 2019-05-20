import functools
from flask import request, jsonify, make_response
from config import DEBUG
from tokenProcessor import TokenProcessor
from Logger import log

token_processor = TokenProcessor()


def verify_token(role_require=1, is_post=False):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            no_token = {
                'username': None,
                'role': None
            }
            if is_post:
                form = request.get_json()
                if not form:
                    form = request.form
                token = form.get("token")
            else:
                token = request.args.get('token')
            if not token:
                if role_require < 0:
                    return func(*args, **dict(kwargs, **no_token))
                return {
                    'success': False,
                    'msg': 'Missing Token'
                }
            stat, msg = token_processor.get_username(token)
            if not stat:
                if role_require < 0:
                    return func(*args, **dict(kwargs, **no_token))
                return {
                    'success': False,
                    'msg': msg
                }
            if msg['role'] < role_require:
                return {
                    'success': False,
                    'msg': 'No Access'
                }
            return func(*args, **dict(kwargs, **msg))

        return wrapper

    return decorator


class ReverseProxied(object):
    '''Wrap the application in this middleware and configure the
    front-end server to add these headers, to let you quietly bind
    this to a URL other than / and to an HTTP scheme that is
    different than what is used locally.

    In nginx:
    location /myprefix {
        proxy_pass http://192.168.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Scheme $scheme;
        proxy_set_header X-Script-Name /myprefix;
        }

    :param app: the WSGI application
    '''

    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        script_name = environ.get('HTTP_X_SCRIPT_NAME', '')
        if script_name:
            environ['SCRIPT_NAME'] = script_name
            path_info = environ['PATH_INFO']
            if path_info.startswith(script_name):
                environ['PATH_INFO'] = path_info[len(script_name):]

        scheme = environ.get('HTTP_X_SCHEME', '')
        if scheme:
            environ['wsgi.url_scheme'] = scheme
        return self.app(environ, start_response)


def make_option_dict(base=None, **kwargs):
    if base is None:
        base = {}
    return dict(base, **{
        k: v for k, v in kwargs.items() if v is not None
    })


def to_json(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        response = make_response(jsonify(func(*args, **kwargs)))
        if DEBUG:
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'POST'
            response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
        return response
        # return json.dumps(func(*args, **kwargs))

    return wrapper


def require_argument(xs, is_post=False, need_raw_payload=False):
    if not isinstance(xs, list):
        xs = [xs]

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # is_post = request.method != 'GET'

            def get_payload():
                if is_post:
                    form = request.get_json()
                    if not form:
                        form = request.form
                    return form
                return request.args

            def get_arg(a):
                return get_payload().get(a)

            missings = [x for x in xs if get_arg(x) is None]
            if len(missings):
                return {"success": False, "msg": "Missing arguments:" + ', '.join(missings)}
            arguments = {x: get_arg(x) for x in xs}
            if need_raw_payload:
                return func(*args, **dict(arguments, **kwargs, raw_payload=get_payload()))
            else:
                return func(*args, **dict(arguments, **kwargs))

        return wrapper

    return decorator


def catch_exception(func):
    if DEBUG:
        return func

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            log.e('Ignored exception: ', e)
            return {
                'success': False,
                'msg': 'Internal Server Error'
            }

    return wrapper


def transform_to(trans):

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return trans(func(*args, **kwargs))

        wrapper.invoke = func
        return wrapper

    decorator.invoke = trans
    return decorator
