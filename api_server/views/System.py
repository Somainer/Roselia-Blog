from flask import Blueprint
from controller.UserManager import UserManager
from middleware import require_argument, to_json, verify_token
from tokenProcessor import TokenProcessor
from config import refresh_salt
from platform_info import RoseliaSysInfo

token_processor = TokenProcessor()

system_view = Blueprint('system_view', __name__, url_prefix='/api/system')

route = system_view.route


@route('/refresh-salt', methods=['POST'])
@to_json
@verify_token(1, True)
def refresh(username, role):
    success = False
    if UserManager.is_master(username):
        success = True
        refresh_salt()

    return {
        'success': success
    }


@route('/basic-info')
@to_json
@verify_token(1)
def get_basic_info(username, role):
    if UserManager.is_master(username):
        return {
            'success': True,
            'result': {
                'os': RoseliaSysInfo.os_full_name(),
                'cpu': RoseliaSysInfo.processor_info()
            }
        }
    return {
        'success': False,
        'msg': 'Not master'
    }


@route('/dynamic-info')
@to_json
@verify_token(1)
def get_dynamic_info(username, role):
    if UserManager.is_master(username):
        return {
            'success': True,
            'result': {
                'cpu': RoseliaSysInfo.cpu_usage(),
                'memory': RoseliaSysInfo.memory_usage()
            }
        }
