import requests
from werkzeug.datastructures import FileStorage
from fn.monad import Option, optionable

from .ImageManager import ImageManager, try_import_from_secret


class CheveretoImageManager(ImageManager):
    identifier = 'chevereto'
    display_name = 'Chevereto'
    description = 'Upload to a hosted chevereto server.'

    KEY_IN_CONFIG = 'CHEVERETO_API_KEY'
    ENDPOINT_IN_CONFIG = 'CHEVERETO_API_ENDPOINT'

    def __init__(self, api_key=None, endpoint=None):
        self.api_key = api_key or try_import_from_secret(self.KEY_IN_CONFIG)
        self.endpoint = endpoint or try_import_from_secret(self.ENDPOINT_IN_CONFIG)

        assert self.api_key, f'Please specify {self.KEY_IN_CONFIG} in secret.py'
        assert self.endpoint, f'Please specify {self.ENDPOINT_IN_CONFIG} in secret.py'

    @optionable
    def add_image(self, image: FileStorage, file_name: str, convert: str) -> Option:
        url = f'{self.endpoint}api/1/upload/?key={self.api_key}&format=json'
        response = requests.post(url, params={
            'key': self.api_key,
            'format': 'json'
        }, files={
            'source': (file_name, image.stream, image.mimetype)
        }).json()

        if response['status_code'] == 200:
            return response['image']['url'], ''
        return None
