import functools
from flask import request
from tokenProcessor import TokenProcessor

token_processor = TokenProcessor()


def verify_token(role_require=1, is_post=False):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if is_post:
                form = request.get_json()
                if not form:
                    form = request.form
                token = form.get("token")
            else:
                token = request.args.get('token')
            if not token:
                return {
                    'success': False,
                    'msg': 'Missing Token'
                }
            stat, msg = token_processor.get_username(token)
            if not stat:
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
