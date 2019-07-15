import requests
from fn.monad import Option
from controller.OauthManager import OauthManager


class GeneralOauth:
    adapter_name = ''

    @classmethod
    def available(cls):
        return False

    @classmethod
    def oauth_uri(cls, **kwargs):
        return ''

    @classmethod
    def get_access_token(cls, code):
        return ''

    @classmethod
    def get_user_information(cls, token):
        return ''

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
