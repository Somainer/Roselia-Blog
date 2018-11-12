from PIL import Image
from PIL import ImageSequence
import os

MAX_WIDTH = 1024


class ImageConverter:
    def __init__(self, img, fname, fmt=None):
        *name, ext = fname.split('.')
        self.mime = self.get_mime_of(fmt or ext)
        self.prev_mime = self.get_mime_of(ext)
        self.prev_name = fname
        self.im = Image.open(img.stream)
        self.format = fmt or ext
        self.newFileName = '{}.{}'.format('.'.join(name), self.format)
        if self.mime == 'GIF':
            return
        w, h = self.im.size
        if w > MAX_WIDTH:
            h = h * MAX_WIDTH // w
            w = MAX_WIDTH
        self.im = self.im.resize((w, h), Image.ANTIALIAS)

    @classmethod
    def get_mime_of(cls, ext):
        mime = ext.upper()
        if mime == 'JPG':
            mime = 'JPEG'
        return mime

    def save(self, path='.'):
        abs_path = os.path.join(path, self.newFileName)
        if self.prev_mime == 'GIF':
            return self.save_gif(path)
        self.im.save(abs_path, self.mime)
        return self.newFileName

    def save_gif(self, path):
        self.im.save(os.path.join(path, self.prev_name), save_all=True)
        return self.prev_name
        # sequence = [f.copy() for f in ImageSequence.Iterator(self.im)]
        # sequence[0].save(path, self.mime, save_all=True, append_images=sequence[1:])
        # self.im.save(path, self.mime, save_all=True)
        # return self.newFileName
