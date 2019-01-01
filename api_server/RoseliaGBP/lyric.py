import re

import requests
from RoseliaGBP import Singleton
import json
from operator import *
from fn.monad import Option
import random


def parse_lyric(lrc):
    lrc_dict = {}
    remove = lambda x: x.strip('[|]')
    for line in lrc.split('\n'):
        time_stamps = re.findall(r'\[[^\]]+\]', line)
        if time_stamps:
            # 截取歌词
            lyric = line
            for tplus in time_stamps:
                lyric = lyric.replace(tplus, '')
            # 解析时间
            for tplus in time_stamps:
                t = remove(tplus)
                tag_flag = t.split(':')[0]
                if not tag_flag.isdigit():
                    continue
                # 时间累加
                time_lrc = int(tag_flag) * 60
                time_lrc += int(t.split(':')[1].split('.')[0])
                lrc_dict[time_lrc] = lyric
    return lrc_dict


def merge_lrc(orig, tran):
    if not tran:
        return orig
    return {
        k: {
            'jpLyric': v,
            'cnLyric': tran[k],
            'lyric': '\n'.join([v, tran[k]])
        } for k, v in orig.items() if k in tran
    }


def pick_from_list(xs):
    return xs[random.randint(0, len(xs) - 1)]


class RoseliaLyric(Singleton):
    def __init__(self):
        if hasattr(self, '_init'):
            return
        self._init = True
        self.song_meta = None
        self.headers = {
            'Cookie': 'appver=2.0.2',
            'Referer': 'http://music.163.com/'
        }
        self.artist_id = '12385096'
        self.session = requests.session()
        self.session.headers = self.headers

    def get_roselia_albums(self, offset=0, limit=50):
        action = 'http://music.163.com/api/artist/albums/{}?offset={}&limit={}'.format(
            self.artist_id, offset, limit)
        try:
            data = self.session.get(action).json()
            return data['hotAlbums']
        except requests.exceptions.RequestException as e:
            print(e)
            return []

    def get_singles(self):
        xs = self.get_roselia_albums()
        singles = sorted(filter(lambda x: x['type'] == 'EP/Single', xs), key=itemgetter('publishTime'))
        # print(list(map(lambda x: x['name'], singles)))

        return singles

    def get_albums(self):
        return sorted(filter(lambda x: x['type'] == '专辑' and x['subType'] == '录音室版', self.get_roselia_albums()),
                      key=itemgetter('publishTime'))

    @classmethod
    def get_ids(cls, payload):
        return map(itemgetter('id'), payload)

    def get_album_songs(self, album_id):
        action = 'http://music.163.com/api/album/{}'.format(album_id)
        try:
            data = self.session.get(action).json()
            return data['album']['songs']
        except requests.exceptions.RequestException as e:
            print(e)
            return []

    def yield_songs(self):
        duplicate_names = set()
        for typ, ls in [('single', self.get_singles()), ('album', self.get_albums())]:
            for idx, single in enumerate(ls, 1):
                sid = single['id']
                single_name = single['name']
                for song in self.get_album_songs(sid):
                    if song['name'] not in duplicate_names:
                        yield {
                            'album': single_name,
                            'name': song['name'],
                            'id': song['id'],
                            'type': typ,
                            'idx': idx,
                            'picUrl': song['album']['picUrl'].replace('http:', 'https:')
                        }
                    duplicate_names.add(song['name'])

    def get_song_lyric(self, song_id):
        action = 'http://music.163.com/api/song/lyric?os=osx&id={}&lv=-1&kv=-1&tv=-1'.format(
            song_id)
        try:
            data = self.session.get(action).json()
            if 'lrc' in data and data['lrc']['lyric'] is not None:
                lyric_info = {
                    'original': data['lrc']['lyric'],
                    'translate': Option(data).map(itemgetter('tlyric')).map(itemgetter('lyric')).get_or(None)
                }
            else:
                lyric_info = None
            return lyric_info
        except requests.exceptions.RequestException as e:
            print(e)
            return None

    def process_lyric(self, lyric):
        original = lyric['original']
        translate = lyric['translate']
        original_dict = parse_lyric(original)
        translate_dict = parse_lyric(translate) if translate else None
        # print_formated(original_dict)
        # print_formated(translate_dict)
        return merge_lrc(original_dict, translate_dict)

    def save_overall_lyric(self):
        self.song_meta = []
        for song in self.yield_songs():
            lyric = self.get_song_lyric(song['id'])
            if lyric:
                merged_lrc = self.process_lyric(lyric)
                self.song_meta.append(dict(song, **lyric, merged_lrc=merged_lrc))

    def get_random_lyric(self, song):
        at, lrc = pick_from_list(list(song['merged_lrc'].items()))
        mini, sec = divmod(at, 60)
        return dict(
            lrc,
            at='{:02d}:{:02d}'.format(mini, sec)
        )

    def get_random_song_lrc(self):
        # print_formated(self.song_meta)
        if not self.song_meta:
            self.save_overall_lyric()
        song = pick_from_list(self.song_meta)
        return dict(self.get_random_lyric(song), name=song['name'], album=song['album'], type=song['type'],
                    id=song['idx'], picUrl=song['picUrl'])


def print_formated(ls):
    print(json.dumps(ls, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    # ls = RoseliaLyric().process_lyric(RoseliaLyric().get_song_lyric(473742881))
    # ls = list(ls)
    # print(json.dumps(ls, ensure_ascii=False, indent=2))
    # for i in range(20):
    #     print_formated(RoseliaLyric().get_random_song_lrc())
    ls = RoseliaLyric().get_singles()
    print_formated(ls)
