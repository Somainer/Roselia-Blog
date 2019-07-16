from .github import GithubOauth
from controller.UserManager import UserManager
from tokenProcessor import TokenProcessor
from fn.monad import Option
from .general import GeneralOauth
from .microsoft import MicrosoftOauth


class GeneralAdapter:
    adapter_name = ''

    def get_uri(self, *args, **kwargs):
        pass

    def login_payload(self, payload):
        pass

    def add_user(self, username, embedding):
        pass

class OAuthAdapter(GeneralAdapter):
    def __init__(self, oauth: GeneralOauth):
        self.adapter_name = oauth.adapter_name
        self.manager = UserManager
        self.token = TokenProcessor()
        self.oauth = oauth
    
    def available(self):
        return self.oauth.available()

    def get_uri(self, callback, **kwargs):
        return self.oauth.oauth_uri(callback, **kwargs)
    
    def login_payload(self, payload):
        def _hndl(args):
            stat, *pld = args
            if not stat:
                return None
            return self.token.iss_token(*pld)[1]['token']

        res = Option.from_call(self.oauth.get_user_by_code, payload).map(self.manager.get_user_meta).map(
            _hndl
        )
        return res

    def add_user(self, username, code):
        return self.oauth.add_record(username, code)

adapter_list = [
    OAuthAdapter(GithubOauth), OAuthAdapter(MicrosoftOauth)
]

adapters = {
  v.adapter_name: v for v in adapter_list if v.available()
}
