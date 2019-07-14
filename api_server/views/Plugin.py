from flask import Blueprint
from controller.PluginStorageManager import PluginStorageManager
from controller.UserManager import UserManager
from middleware import require_argument, to_json, verify_token
from tokenProcessor import TokenProcessor

token_processor = TokenProcessor()

system_view = Blueprint('plugin_view', __name__, url_prefix='/api/plugin-storage')

route = system_view.route


@route('/get-content')
@require_argument(['application', 'key'])
@verify_token(0)
@to_json
def get_content(application, key, username, role):
    return {
        'success': True,
        'result': PluginStorageManager.get_content(application, key, username)
    }


@route('/new-record', methods=['POST'])
@require_argument(['application', 'key', 'content'], is_post=True, need_raw_payload=True)
@verify_token(0, is_post=True)
@to_json
def new_record(application, key, content, username, role, raw_payload):
    result = PluginStorageManager.new_record(application, key, content, username, raw_payload.get('index'))
    return {
        'success': not not result
    }


@route('/search-records')
@require_argument(['application', 'index'])
@verify_token(0)
@to_json
def search_records(application, index, username, role):
    result = PluginStorageManager.search_records(application, index, username)
    return {
        'success': not not result,
        'result': result
    }


@route('/edit-record', methods=['POST'])
@require_argument(['application', 'key', 'content'], is_post=True, need_raw_payload=True)
@verify_token(0, is_post=True)
@to_json
def edit_record(application, key, username, role, raw_payload):
    result = PluginStorageManager \
        .edit_record(application, key, raw_payload.get('content'), username,
                     raw_payload.get('index'))
    return {
        'success': not not result
    }


@route('/delete-record', methods=['POST'])
@require_argument(['application', 'key'], is_post=True)
@verify_token(0, is_post=True)
@to_json
def delete_record(application, key, username, role):
    result = PluginStorageManager \
        .delete_record(application, key, username)
    return {
        'success': not not result
    }


@route('/delete-by-index', methods=['POST'])
@require_argument(['application', 'index', 'all'], is_post=True)
@verify_token(0, is_post=True)
@to_json
def delete_by_index(application, index, all, username, role):
    result = PluginStorageManager \
        .delete_by_index(application, index, bool(all), username)
    return {
        'success': not not result
    }


@route('/remove-application', methods=['POST'])
@require_argument(['application'], is_post=True)
@verify_token(1, is_post=True)
@to_json
def remove_application(application, username, role):
    result = UserManager.is_master(username)
    if result:
        result = PluginStorageManager.remove_application(application)
    return {
        'success': not not result
    }
