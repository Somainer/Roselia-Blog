from secret import APP_KEY, APP_SALT, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
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


COLOR = {
    "light": {
        "themeColor": "#6670ed",  # 7c4dff",
        "textColor": "#651fff",
        "btnHover": "#8289f3"
    },
    "dark": {
        "themeColor": "#5869b1",
        "textColor": "#5f5dd3",
        "btnHover": "#687ac9"
    }
}["light"]

UPLOAD_DIR = '../static/img'


