from flask import Blueprint, request
from controller.SharedManager import SharedManager
from middleware import require_argument, to_json, verify_token
from controller.PostManager import PostManager

shared_manager = SharedManager()
post_manager = PostManager()

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

@route('/user/<string:uname>')
@to_json
@verify_token(-1)
def get_user_posts(uname, username, role):
    level = 0 if role is None else role + 1
    page = request.args.get('page', 1, int)
    limit = request.args.get('limit', 20, int)
    offset = (page - 1) * limit
    total, posts = post_manager.get_posts_from_author(uname, offset, limit, level, username)
    pages = total // limit + (total % limit > 0)
    return {
        'data': posts, 'total': total, 'pages': pages, 'valid': username is not None
    }
