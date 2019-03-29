from flask import Blueprint
from controller.SharedManager import SharedManager
from middleware import require_argument, to_json, verify_token
from tokenProcessor import TokenProcessor

token_processor = TokenProcessor()
shared_manager = SharedManager()

post_view = Blueprint('post_view', __name__, url_prefix='/api/post')

route = post_view.route


@route('/share', methods=['POST'])
@to_json
@verify_token(0, True)
@require_argument('pid', True)
def share_post(pid, username, role):
    share = shared_manager.share_post(pid, role)
    return {
        'success': share is not None,
        'result': share
    }


@route('/get-shared/<string:sid>')
@to_json
def get_shared(sid):
    post = shared_manager.get_shared_post(sid)
    return post
