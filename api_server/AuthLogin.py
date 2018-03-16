import multiprocessing
import os
import binascii
import time


class AuthLogin:
    def __init__(self, exp_time=60):
        self.dic = {}
        self.conns = {}
        self.exp_time = exp_time

    @staticmethod
    def gen_code():
        return int(binascii.hexlify(os.urandom(3)).decode(), 16) % 1000000

    def gen_random_token(self, conn):
        code = self.gen_code()
        while code in self.dic and self.not_expired(self.dic[code]):
            code = self.gen_code()
        self.conns[code] = conn
        self.dic[code] = {
            "iss_time": time.time()
        }
        return code

    def set_code(self, code, user):
        if code in self.dic:
            self.dic[code] = {
                "user": user,
                "iss_time": time.time()
            }
            return True
        else:
            return False

    def confirm_login(self, code):
        if code in self.dic:
            self.dic[code]["confirmed"] = True
            return True
        else:
            return False

    def not_expired(self, res):
        return (res.get("iss_time", 0) + self.exp_time) >= time.time()

    def get_code(self, code):
        res = self.dic.get(code)
        if res:
            if self.not_expired(res):
                return True, res
            return False, "Time expired"
        return False, "Wrong code"

    def pop_code(self, code):
        return self.dic.pop(code)



