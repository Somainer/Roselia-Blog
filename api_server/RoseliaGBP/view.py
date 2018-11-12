from flask import Blueprint
from .lyric import RoseliaLyric
from middleware import to_json

bp = Blueprint('roselia-gbp', __name__, url_prefix='/api/roselia')

rl = RoseliaLyric()


@bp.route('/lyric/random')
@to_json
def get_random_lyric():
    return rl.get_random_song_lrc()


@bp.route('/lyric/refresh', methods=['POST'])
@to_json
def refresh_song():
    rl.save_overall_lyric()
    return {
        'success': True,
        'msg': 'Refreshed'
    }
