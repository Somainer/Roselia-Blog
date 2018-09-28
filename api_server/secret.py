import os


def gen_key():
    return os.urandom(24)


APP_KEY = 'MODIFY_OR_EMPTY_WHEN_CHANGE_EVERY_LAUNCH' or gen_key()
APP_SALT = 'MODIFY_OR_EMPTY_WHEN_CHANGE_EVERY_LAUNCH' or gen_key()


GITHUB_CLIENT_ID = ''
GITHUB_CLIENT_SECRET = ''
