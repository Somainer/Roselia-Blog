from PIL import Image
import os

MAX_WIDTH = 1024


class ImageConverter:
    def __init__(self, img, fname, fmt=None):
        *name, ext = fname.split('.')
        self.mime = fmt.upper() if fmt else ext.upper()
        if self.mime == 'JPG':
            self.mime = 'JPEG'
        self.im = Image.open(img.stream)
        self.format = fmt or ext
        self.newFileName = '{}.{}'.format('.'.join(name), self.format)
        w, h = self.im.size
        if w > MAX_WIDTH:
            h = h * MAX_WIDTH // w
            w = MAX_WIDTH
        self.im = self.im.resize((w, h), Image.ANTIALIAS)

    def save(self, path='.'):
        self.im.save(os.path.join(path, self.newFileName), self.mime)
        return self.newFileName
