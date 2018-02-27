BLOG_LINK = "https://roselia.moe/blog/"
BLOG_INFO = {
    "title": "Roselia-Blog",
    "motto": "Do what you want to do, be who you want to be."
}
DEBUG = True

DB_USER = 'User.db'
DB_POST = 'Post.db'

import os
def gen_key():
    return os.urandom(24)
APP_KEY = '' or gen_key()
APP_SALT = '' or gen_key()