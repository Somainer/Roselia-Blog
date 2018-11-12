from config import GITHUB_CLIENT_SECRET, GITHUB_CLIENT_ID
import requests
from fn.monad import Option


class GithubOauth:
    @classmethod
    def available(cls):
        return GITHUB_CLIENT_SECRET and GITHUB_CLIENT_ID

    @classmethod
    def oauth_uri(cls):
        return 'https://github.com/login/oauth/authorize?client_id={}&scope=user:email'.format(GITHUB_CLIENT_ID)

    @classmethod
    def get_access_token(cls, code):
        resp = requests.post('https://github.com/login/oauth/access_token', {
            'client_id': GITHUB_CLIENT_ID,
            'client_secret': GITHUB_CLIENT_SECRET,
            'code': code
        }, headers={
            'Accept': 'application/json'
        })
        js = resp.json()
        return js.get('access_token')

    @classmethod
    def get_user_information(cls, token):
        resp = requests.get('https://api.github.com/user', {
            'access_token': token
        })
        js = resp.json()
        return js.get('login')

    @classmethod
    def get_user_by_code(cls, code):
        return Option.from_call(cls.get_access_token, code).map(cls.get_user_information).get_or(None)
