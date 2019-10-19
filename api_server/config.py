from secret import APP_KEY, APP_SALT as SALT, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, gen_key
from werkzeug.local import LocalProxy
from itsdangerous import want_bytes

BLOG_LINK = "https://roselia.moe/blog/"
BLOG_INFO = {
    "title": "Roselia-Blog",
    "motto": "Do what you want to do, be who you want to be.",
    "link": BLOG_LINK
}
DEBUG = True
ANTI_SEO = False

HOST = '0.0.0.0'
PORT = 5000

DB_PATH = 'sqlite:///roselia.db'

UPLOAD_DIR = '../static/img'

APP_SALT = LocalProxy(lambda: want_bytes(SALT))


def refresh_salt():
    global SALT
    SALT = gen_key()
