from flask import request
from flask_socketio import SocketIO, emit, Namespace, ConnectionRefusedError
from fn.monad import Option
from operator import itemgetter, attrgetter

from models.KVStorage import DefaultStorage
from controller.UserManager import UserManager
from middleware import token_processor, get_token_from_request

namespace = '/api/socket'

socket_view = SocketIO(path=namespace, cors_allowed_origins="*")


class UserSessionManager:
    def __init__(self):
        self.dict = DefaultStorage()
        self.sid_dict = DefaultStorage()

    def _put_user_unchecked(self, username, sid, ls):
        self.dict.put(username, ls)
        self.sid_dict.put(sid, username)

    def _pop_user_unchecked(self, username, sid):
        previous = self.dict.get(username)  # type: list
        previous.remove(sid)

        if previous:
            self.dict.put(username, previous)
        else:
            self.dict.remove(username)

        self.sid_dict.remove(sid)

    def add_user(self, username: str, sid: str):
        if self.dict.has(username):
            previous = self.dict.get(username)  # type: list
            if sid not in previous:
                previous.append(sid)
                self._put_user_unchecked(username, sid, previous)
        else:
            self._put_user_unchecked(username, sid, [sid])

    def remove_sid(self, sid: str):
        if self.sid_dict.has(sid):
            self._pop_user_unchecked(self.sid_dict.get(sid), sid)

    def get_user_sids(self, username):
        return self.dict.get_option(username).get_or([])

    def is_online(self, username):
        return self.dict.has(username)


class RoseliaSocketNS(Namespace):
    session = UserSessionManager()

    @property
    def sid(self):
        return request.sid

    @property
    def token(self):
        return get_token_from_request()

    @property
    def username(self):
        return Option(self.token) \
            .map(token_processor.get_username) \
            .filter(itemgetter(0)) \
            .map(itemgetter(1)).map(itemgetter('username')).get_or(None)

    def on_connect(self):
        username = self.username
        username = UserManager.find_user_option(username).map(attrgetter('username')).get_or(username)
        if username:
            self.session.add_user(username, self.sid)
            self.enter_room(self.sid, username)
        else:
            self.emit('reject', 'You should login first.')
            raise ConnectionRefusedError('Not Authorized', 'Missing token or token expired.')

    def on_disconnect(self):
        self.session.remove_sid(self.sid)

    def on_send_message(self, data):
        to = data['to']
        if self.session.is_online(to):
            self.emit('inbox_message', data, room=to)
        else:
            self.emit('warn_message', {
                'message': '{} is offline and may not respond.'.format(to)
            })


main_ns = RoseliaSocketNS(namespace)
socket_view.on_namespace(main_ns)
