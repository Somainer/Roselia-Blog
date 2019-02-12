from flask import Blueprint
from middleware import to_json, require_argument, verify_token
from controller.OauthManager import OauthManager

oauth_view = Blueprint('oauth_view', __name__, url_prefix='/api/oauth')

route = oauth_view.route


@route('/remove-adapter/<string:third>', methods=['POST'])
@to_json
@require_argument('token')
@verify_token(0, True)
def remove_adapter(third, username, role):
    result = username and OauthManager.remove_adapters(username, third)
    return {
        'success': result
    }


@route('/list-bind-adapters')
@to_json
@verify_token(0)
def get_adapters(username, role):
    result = username and OauthManager.get_adapters(username)
    return {
        'success': not not result,
        'result': result
    }
