import requests
from flask import Blueprint, url_for
import datetime
from lxml import html
from urllib.parse import urlparse, urlunparse, urljoin

from GFMarkDown import markdown
from middleware import verify_token, transform_to, to_json
from config import GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

# Fake post is to load post that is not written in Roselia-Blog.
# Here is an example for reading markdowns from GitHub.
fake_post_view = Blueprint('fake-post', __name__)


@fake_post_view.route('/api/post-link/github/<string:github_username>/<string:repo>/blob/<path:p>')
@fake_post_view.route('/api/post-link/github.com/<string:github_username>/<string:repo>/blob/<path:p>')
@to_json
@transform_to(lambda x: x if x.get('success', True) else None)
@verify_token(0)
def fetch_github_fake_post(github_username: str, repo: str, p: str, username, role):
    raw_file_uri = 'https://raw.githubusercontent.com/{}/{}/{}'.format(github_username, repo, p)
    file_content = requests.get(raw_file_uri, headers={'Connection': 'close'}).text
    user_meta = github_user_info(github_username)

    raw_content = markdown(file_content)
    content = intercept_links(raw_content, raw_file_uri,
                              url_for('.fetch_github_fake_post', github_username=github_username, repo=repo, p=p))
    user_dict = {
        'avatar': user_meta['avatar_url'],
        'id': int(user_meta['id']),
        'role': role + 1,
        'username': user_meta['login'],
        'nickname': user_meta['name']
    }

    now = datetime.datetime.now()
    post = {
        'id': 0,
        'display_id': None,
        'title': '{}/{}'.format(repo, p.split('/')[-1]),
        'subtitle': '{}/{}'.format(github_username, repo),
        'content': content,
        'created': now,
        'last_edit': now,
        'date': now.strftime('%b %d, %Y'),
        'img': '',
        'dark_title': False,
        'enable_comment': False,
        'author': user_dict,
        'secret': 0,
        'hidden': False,
        'tags': ['GitHub', github_username, repo],
        'catalogs': [],
        'next': -1,
        'prev': -1
    }

    return post


def intercept_links(content: str, base_url: str, fake_post_url: str):
    document = html.fromstring(content, base_url)  # type: html.HtmlElement
    for el, attribute, link, pos in document.iterlinks():
        if el.tag == 'img':
            el.set(attribute, urljoin(base_url, link))
    return html.tostring(document).decode()


GITHUB_USER_CACHE = {}


def github_user_info(username: str):
    if username in GITHUB_USER_CACHE:
        return GITHUB_USER_CACHE[username]
    if GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET:
        basic_auth = (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)
    else:
        basic_auth = None

    user_meta_uri = 'https://api.github.com/users/{}'.format(username)
    response = requests.get(user_meta_uri, headers={'Connection': 'close'}, auth=basic_auth)
    if response.status_code != 200:  # Here must be something wrong.
        return {
            'avatar_url': '',
            'id': 0,
            'name': username,
            'login': username
        }

    user_data = response.json()
    GITHUB_USER_CACHE[username] = user_data
    return user_data
