import os
import binascii


def gen_key():
    return binascii.b2a_hex(os.urandom(24))


APP_KEY = 'MODIFY_OR_EMPTY_WHEN_CHANGE_EVERY_LAUNCH' or gen_key()
APP_SALT = 'MODIFY_OR_EMPTY_WHEN_CHANGE_EVERY_LAUNCH' or gen_key()


GITHUB_CLIENT_ID = 'caa0245db4915a2f697b'
GITHUB_CLIENT_SECRET = 'e4f7ee6e5249aba0229f8664eef9dd9bf2da4895'
