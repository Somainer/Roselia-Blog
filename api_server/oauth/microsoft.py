from secret import MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET
import requests
from fn.monad import Option
from .general import GeneralOauth
import time
from urllib.parse import quote
import json

last_callback = ''

class MicrosoftOauth(GeneralOauth):
    adapter_name = 'microsoft'

    @classmethod
    def available(cls):
        return MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET

    @classmethod
    def oauth_uri(cls, callback, **kwargs):
        last_callback = callback
        return 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id={}&nonce={}&scope=openid+profile+User.Read&response_type=code&redirect_uri={}&state={}'.format(
            MICROSOFT_CLIENT_ID, time.time(), quote(kwargs.get('raw_callback', callback)),
            Option.from_call(kwargs.get, 'state').map(json.dumps).get_or(''))

    @classmethod
    def get_access_token(cls, code):
        resp = requests.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            'client_id': MICROSOFT_CLIENT_ID,
            'client_secret': MICROSOFT_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': last_callback
        }, headers={
            'Accept': 'application/json'
        })
        js = resp.json()
        return js.get('access_token')

    @classmethod
    def get_user_information(cls, token):
        resp = requests.get('https://graph.microsoft.com/v1.0/me/', headers={
            'Authorization': 'Bearer {}'.format(token)
        })
        js = resp.json()
        return js.get('id')

    @classmethod
    def get_username_by_code_option(cls, code):
        return Option \
            .from_call(cls.get_access_token, code) \
            .map(cls.get_user_information)

    @classmethod
    def get_user_by_code(cls, code):
        return cls.get_username_by_code_option(code) \
            .map(
            lambda u: OauthManager.get_embedding_user(cls.adapter_name, u)
        ).get_or(None)
        # return Option.from_call(cls.get_access_token, code).map(cls.get_user_information).get_or(None)

    @classmethod
    def add_record(cls, username, code):
        return cls.get_username_by_code_option(code).map(
            lambda embedding: OauthManager.add_adapter(
                username,
                cls.adapter_name,
                embedding
            )
        ).get_or(None)
