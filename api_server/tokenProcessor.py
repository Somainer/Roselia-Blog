from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
from itsdangerous import SignatureExpired, BadSignature, BadData
import time


class TokenProcessor:
    def __init__(self):
        self.secret_key = ''
        self.salt = ''
        self.token_exp = 3600
        self.rftoken_exp = self.token_exp * 24
        self.serializer = Serializer(secret_key=self.secret_key, salt=self.salt, expires_in=self.token_exp)

    def iss_token(self, username, role):
        iss_time = time.time()
        return True, {
            'token': self.serializer.dumps({
                'username': username,
                'iat': iss_time,
                'userRole': role
            }).decode()
        }

    def iss_su_token(self, username, level=1):
        iss_time = time.time()
        serializer = Serializer(secret_key=self.secret_key, salt=self.salt, expires_in=600)
        return serializer.dumps({
            'admin': username,
            'iat': iss_time,
            'su': level
        }).decode()

    def is_su(self, token):
        stat, payload = self.token_decode(token)
        if not stat or 'su' not in payload:
            return False, payload
        return True, {
            'admin': payload['admin'],
            'su': payload['su']
        }

    def token_decode(self, token):
        serializer = Serializer(secret_key=self.secret_key, salt=self.salt)
        try:
            data = serializer.loads(token)
        except SignatureExpired:
            return False, 'expired'
        except BadSignature:
            return False, 'bad token'
        except:
            return False, 'unknown error'
        return True, data

    def get_username(self, token):
        state, data = self.token_decode(token)
        if not state:
            return state, data
        username = data.get('username')
        role = data.get('userRole')
        return all([username, role is not None]), {
            'username': username,
            'role': role
        }
