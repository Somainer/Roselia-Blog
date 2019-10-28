from flask import Blueprint, request
from controller.SharedManager import SharedManager
from middleware import require_argument, to_json, verify_token
from controller.PostManager import PostManager
import GFMarkDown

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


@route('/render-markdown', methods=['POST'])
@to_json
@verify_token(0, True)
@require_argument('markdown', True)
def render_markdown(username, role, markdown):
    return {
        'success': True,
        'result': GFMarkDown.markdown(markdown)
    }


@route('/meta/id/<int:p>')
@route('/meta/link/<string:p>')
@to_json
@verify_token(-1)
def get_post_info(p, username, role):
    post = post_manager.find_post(p)
    if role is None:
        level = 0
    else:
        level = role + 1
    
    if not post or post['secret'] > level:
        return {
            'success': False,
            'result': 'Post not found.'
        }
    post.pop('content')
    return {
        'success': True,
        'result': {
            **post,
            'prev': post_manager.get_prev(post['id'], level, username),
            'next': post_manager.get_next(post['id'], level, username)
        }
    }
