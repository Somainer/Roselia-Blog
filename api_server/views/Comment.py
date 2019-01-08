from flask import Blueprint, request
from fn.monad import Option

from controller.UserManager import UserManager
from controller.CommentManager import CommentManager
from middleware import require_argument, to_json, verify_token

comment_view = Blueprint('comment_view', __name__, url_prefix='/api/comment')

route = comment_view.route


@route('/add', methods=['POST'])
@to_json
@require_argument(['content', 'to_post'], True, True)
@verify_token(-1, True)
def add_comment(username, role, content, to_post, raw_payload):
    nickname = raw_payload.get('nickname')
    name = username or nickname
    if not name:
        return {
            'success': False,
            'msg': 'Missing nickname or token expired.'
        }

    to_post = Option.from_call(int, to_post).get_or(None)

    if not to_post:
        return {
            'success': False,
            'msg': 'to_post should be a number'
        }

    state, msg = CommentManager.add_comment(to_post, content, raw_payload.get('to_comment'), username, nickname)
    return {
        'success': state,
        'msg': msg
    }


@route('/delete', methods=['POST'])
@to_json
@require_argument(['comment'], True)
@verify_token(1, True)
def remove_comment(comment, username, role):
    stat = CommentManager.delete_comment(comment, username)
    return {
        'success': stat
    }


@route('/comments')
@to_json
@require_argument('p')
def get_comments(p):
    limit = request.args.get('limit', None, int)
    page = request.args.get('page', 1, int)
    offset = (page - 1) * limit if limit and page else None
    p_int = Option.from_call(int, p)
    result = p_int \
        .map(lambda pid:
             CommentManager.get_comments(p, limit, offset))
    total_pages = p_int\
        .map(lambda pid: CommentManager.get_comment_count(pid))\
        .map(lambda count: count // limit + (count % limit > 0))
    return {
        'success': not result.empty,
        'result': result.get_or(None),
        'pages': total_pages.get_or(None)
    }
