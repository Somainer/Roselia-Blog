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
