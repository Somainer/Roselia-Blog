#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import shutil
from distutils import dir_util
import os
import re

roselia_base_dir = os.path.realpath(os.path.join(os.path.dirname(__file__), '..'))


def copy_built_assets():
    in_relate_dir = lambda *path: os.path.realpath(os.path.join(roselia_base_dir, *path))

    dist_dir = in_relate_dir('frontend', 'dist')
    asset_dir = in_relate_dir('static')
    static_dir = os.path.join(dist_dir, 'static')
    dir_util.copy_tree(static_dir, asset_dir)

    def find_assets(in_dir):
        files = os.listdir(in_dir)
        asset_regex = re.compile(r'([a-zA-Z0-9_-]+)\.(\w+)\.(js|css)$')
        return list(filter(asset_regex.match, files))

    assets = find_assets(os.path.join(static_dir, 'css')) + find_assets(os.path.join(static_dir, 'js'))
    print("Found build css and js:")
    print('\n'.join(map(lambda s: '\t*' + s, assets)))

    templates = [
        'index_vue.html',
        'post_vue.html'
    ]

    def replace_str_in_file(file_name):
        with open(file_name, 'r+') as f:
            content = f.read()

            for asset in assets:
                name, _, ext = asset.split('.')
                content = re.sub(r'{}\.\w+\.{}'.format(name, ext), asset, content)

            f.seek(0)
            f.write(content)

    for template in templates:
        print('\tReplacing template:', template)
        replace_str_in_file(in_relate_dir('api_server', 'templates', template))


def serve():
    from api_server import run_server
    run_server()


def compress_assets():
    sys.path.append(os.path.join(roselia_base_dir, 'scripts'))
    from bootstrap import build_assets

    build_assets()


def assets():
    compress_assets()
    copy_built_assets()


def build_frontend():
    frontedn_path = os.path.join(roselia_base_dir, 'frontend')
    cur_dir = os.curdir
    os.chdir(frontedn_path)
    os.system('yarn')
    os.system('yarn build')
    os.chdir(cur_dir)


def build():
    compress_assets()
    build_frontend()
    copy_built_assets()


def run_prod():
    import config
    config.DEBUG = False

    serve()


def run_dev():
    import config
    config.DEBUG = True

    serve()


def run_gunicorn():
    args = sys.argv[2:]

    os.chdir(os.path.dirname(__file__))
    os.system('gunicorn api_server:app ' + ' '.join(args))


if __name__ == '__main__':
    from config import BLOG_INFO

    print('Welcome to', BLOG_INFO['title'], '-', BLOG_INFO['motto'])
    if len(sys.argv) < 2:
        print('No argument')
    else:
        arg = sys.argv[1]
        operate = {
            'serve': serve,
            'compress-assets': compress_assets,
            'copy-assets': copy_built_assets,
            'assets': assets,
            'build': build,
            'build-frontend': build_frontend,
            'run-prod': run_prod,
            'run-dev': run_dev,
            'run-gunicorn': run_gunicorn
        }


        def otherwise():
            print("No operation")


        operate.get(arg, otherwise)()
