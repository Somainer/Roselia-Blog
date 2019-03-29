from fn.monad import optionable
from uuid import uuid1


class RoseliaKVStorage:
    def get(self, key: str):
        pass

    @optionable
    def get_option(self, key: str):
        return self.get(key)

    def put(self, key: str, value):
        pass

    def remove(self, key: str):
        pass

    def has(self, key: str) -> bool:
        return not self.get_option(key).empty

    def __contains__(self, item):
        return self.has(item)

    @classmethod
    def gen_random(cls):
        return uuid1().hex

    def put_random(self, value):
        idx = self.gen_random()
        self.put(idx, value)
        return idx


class DictStorage(RoseliaKVStorage):
    def __init__(self):
        self.payload = {}

    def get(self, key: str):
        return self.payload.get(key)

    def put(self, key: str, value):
        self.payload[key] = value

    def remove(self, key: str):
        self.payload.pop(key)

    def has(self, key: str):
        return key in self.payload


DefaultStorage = DictStorage
