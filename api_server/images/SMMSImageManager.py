import requests
from werkzeug.datastructures import FileStorage
from fn.monad import Option, optionable

from .ImageManager import ImageManager, try_import_from_secret


class SMMSImageManager(ImageManager):
    identifier = 'smms'
    display_name = 'sm.ms'
    description = 'Upload to sm.ms hosting service.'

    api_base = 'https://sm.ms/api/v2/'

    TOKEN_KET_IN_CONFIG = 'SM_MS_API_TOKEN'

    def __init__(self, api_token=None, *, anonymous=False):
        self.api_token = api_token or try_import_from_secret(self.TOKEN_KET_IN_CONFIG)
        if anonymous:
            self.api_token = ''
        else:
            assert self.api_token, f'Please specify {self.TOKEN_KET_IN_CONFIG} in secret.py'

        if not self.api_token:
            self.identifier = self.identifier + '-anon'
            self.description = SMMSImageManager.description + ' (via anonymous account)'

    @optionable
    def add_image(self, image: FileStorage, file_name: str, convert: str) -> Option:
        url = f'{self.api_base}upload'
        response = requests.post(url, files={
            'smfile': (file_name, image.stream, image.mimetype)
        }, headers={
            'Authorization': self.api_token
        }).json()

        if response['success']:
            return response['data']['url'], response['data']['delete']

    def delete_image(self, image: str):
        if image.startswith('https://sm.ms/delete/'):
            url = image
        else:
            url = f'https://sm.ms/delete/{image}'

        response = requests.get(url, headers={
            'Authorization': self.api_token
        }).text

        if 'Oops!' in response:
            return False, 'File does not exist or is deleted.'

        return True, 'File deleted.'

    def list(self):
        if self.api_token:
            url = f'{self.api_base}upload_history'
        else:
            url = f'{self.api_base}history'

        response = requests.get(url, headers={
            'Authorization': self.api_token
        }).json()

        if response['success']:
            return [
                {
                    'url': data['url'],
                    'deleteKey': data['delete'],
                    'fileName': data['filename'],
                    'channel': self.identifier
                }
                for data in response['data']
            ]

        return []
