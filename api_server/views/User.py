from flask import Blueprint
from controller.UserManager import UserManager
from middleware import require_argument, to_json, verify_token

user_view = Blueprint('user_view', __name__, url_prefix='/api/user')

route = user_view.route


@route('/nickname')
@to_json
@require_argument('username')
def get_nickname(username):
    nickname = UserManager.find_user_option(username).map(lambda x: x.nickname).get_or(None)
    return {
        'success': nickname is not None,
        'nickname': nickname
    }


@route('/set-nickname', methods=['POST'])
@to_json
@verify_token(0, True)
@require_argument('nickname', True)
def set_nickname(username, role, nickname):
    return {'success': UserManager.set_nickname(username, nickname)}


@route('/user-meta')
@to_json
@require_argument('username')
def get_user_meta(username):
    user = UserManager.get_user_dict(username)
    return {
        'success': user is not None,
        'result': user
    }


@route('/two-step-auth/bind', methods=['POST'])
@to_json
@verify_token(0, True)
def bind_two_factor(username, role):
    result = UserManager.bind_totp(username)
    return {
        'success': result is not None,
        'result': result
    }


@route('/two-step-auth/remove', methods=['POST'])
@to_json
@verify_token(0, True)
@require_argument('code', is_post=True)
def remove_two_factor(username, role, code):
    return {
        'success': UserManager.remove_totp(username, code)
    }
