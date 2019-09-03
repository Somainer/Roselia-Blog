import os
import binascii


def gen_key():
    return binascii.b2a_hex(os.urandom(24))


APP_KEY = 'MODIFY_OR_EMPTY_WHEN_CHANGE_EVERY_LAUNCH' or gen_key()
APP_SALT = 'MODIFY_OR_EMPTY_WHEN_CHANGE_EVERY_LAUNCH' or gen_key()


GITHUB_CLIENT_ID = ''
GITHUB_CLIENT_SECRET = ''

MICROSOFT_CLIENT_ID = ''
MICROSOFT_CLIENT_SECRET = ''

LUIS_URL_BASE = ''

YUKINA_BOT = {} # {'key': '', 'url': ''}
