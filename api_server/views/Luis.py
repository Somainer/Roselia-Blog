import requests

from flask import Blueprint
from middleware import to_json, require_argument

try:
    from secret import LUIS_URL_BASE
except ImportError:
    LUIS_URL_BASE = ''

try:
    from secret import YUKINA_BOT
except ImportError:
    YUKINA_BOT = {}

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


@route('/ask-yukina')
@require_argument('question')
@to_json
def ask_yukina(question):
    if not YUKINA_BOT:
        return {
            'success': False,
            'msg': 'You need a chatbot.'
        }

    result = requests.post(YUKINA_BOT['url'], json={
        'question': question
    }, headers={
        'Authorization': 'EndpointKey {}'.format(YUKINA_BOT['key']),
        'Content-Type': 'application/json'
    }).json()
    return {
        'success': True,
        'result': [x['answer'] for x in result['answers'] if x['score'] > 50] or [
            "Oh, you’ve got me there."]
    }
