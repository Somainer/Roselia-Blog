from .github import GithubOauth
from controller.UserManager import UserManager
from tokenProcessor import TokenProcessor
from fn.monad import Option


class GeneralAdapter:
    adapter_name = ''

    def get_uri(self, *args, **kwargs):
        pass

    def login_payload(self, payload):
        pass

    def add_user(self, username, embedding):
        pass


class GithubAdapter(GeneralAdapter):
    adapter_name = 'github'

    def __init__(self):
        self.manager = UserManager
        self.token = TokenProcessor()

    @classmethod
    def available(cls):
        return GithubOauth.available()

    def get_uri(self):
        return GithubOauth.oauth_uri()

    def login_payload(self, payload):
        def _hndl(args):
            stat, *pld = args
            if not stat:
                return None
            return self.token.iss_token(*pld)[1]['token']

        res = Option.from_call(GithubOauth.get_user_by_code, payload).map(self.manager.get_user_meta).map(
            _hndl
        )
        return res

    def add_user(self, username, code):
        return GithubOauth.add_record(username, code)


adapters_list = {
    GithubAdapter.adapter_name: GithubAdapter
}

adapters = {
    k: v() for k, v in adapters_list.items() if v.available()
}
