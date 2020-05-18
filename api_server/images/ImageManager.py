from werkzeug.datastructures import FileStorage
from fn.monad import Option


class ImageManager:
    identifier = ''
    display_name = ''
    description = ''

    def list(self):
        raise NotImplementedError(self.list.__name__)

    def add_image(self, image: FileStorage, file_name: str, convert: str) -> Option:
        raise NotImplementedError(self.add_image.__name__)

    def delete_image(self, image):
        raise NotImplementedError(self.delete_image.__name__)


def try_import_from_secret(key):
    import secret
    result = getattr(secret, key, None)
    if not result:
        return None
    return result
