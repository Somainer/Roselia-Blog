import requests

from flask import Blueprint
from middleware import to_json, require_argument

try:
    from secret import LUIS_URL_BASE
except:
    LUIS_URL_BASE = ''

luis_view = Blueprint('luis_view', __name__, url_prefix='/api/luis')

route = luis_view.route


@route('/run-command')
@require_argument('command')
@to_json
def run_command(command):
    if not LUIS_URL_BASE:
        return {
            'success': False,
            'msg': 'Operation is not complete because you do not have a luis subscription.'
        }

    response = requests.get(LUIS_URL_BASE + command).json()
    return {
        'success': True,
        'result': response
    }
