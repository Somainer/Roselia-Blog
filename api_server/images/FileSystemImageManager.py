import os
import datetime
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename
from flask import url_for
from fn.monad import optionable, Option, Empty

from .ImageManager import ImageManager
from config import UPLOAD_DIR
from ImageConverter import ImageConverter


class FileSystemImageManager(ImageManager):
    identifier = 'roselia'
    display_name = 'Roselia'
    description = 'Upload to this site directly.'

    supported_extensions = {'jpg', 'jpeg', 'png', 'bmp', 'webp', 'gif'}

    def __init__(self, upload_dir=None):
        self.upload_dir = upload_dir or UPLOAD_DIR
        assert self.upload_dir, "Please specify UPLOAD_DIR in config.py"

    def is_supported_filename(self, file_name: str):
        return file_name.split('.')[-1].lower() in self.supported_extensions

    def add_image(self, file: FileStorage, file_name: str, convert: str) -> Option:
        if file and self.is_supported_filename(file_name):
            filename = secure_filename(file.filename)
            if not os.path.exists(self.upload_dir):
                os.mkdir(self.upload_dir)
            filename = datetime.datetime.now().strftime("Upload_%Y%m%d%H%M%S_") + filename
            filename = ImageConverter(file, filename, convert).save(self.upload_dir)

            return Option((self.get_url(filename), filename))
        return Empty()

    def list(self):
        file_list = \
            [x for x in os.listdir(self.upload_dir) if
             os.path.isfile(os.path.join(self.upload_dir, x)) and self.is_supported_filename(x)]

        return [{
            'url': url,
            'fileName': name,
            'deleteKey': name,
            'channel': self.identifier
        } for name, url in zip(file_list, map(self.get_url, file_list))]

    def delete_image(self, file_name):
        secure = secure_filename(file_name)
        if secure != file_name:
            return False, 'Do not play tricks.'
        full_path = os.path.join(self.upload_dir, secure)
        success = os.path.exists(full_path)
        if success:
            os.remove(full_path)
            return True, 'Image deleted'
        return False, 'File not found.'

    @classmethod
    def get_url(cls, filename: str) -> str:
        return url_for('uploaded_file', filename=filename)
