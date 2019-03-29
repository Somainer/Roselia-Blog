from models.KVStorage import DefaultStorage
import time
from controller.PostManager import PostManager
post_manager = PostManager()


class SharedManager:
    def __init__(self):
        self.storage = DefaultStorage()

    def new_shared(self, post_id):
        return self.storage.put_random({
            'id': post_id,
            'activated': False,
            'time': 0
        })

    def get_shared(self, sid):
        if sid not in self.storage:
            return None

        post_info = self.storage.get(sid)
        idx = post_info['id']
        if not post_info['activated']:
            self.storage.put(sid, {
                'id': idx,
                'activated': True,
                'time': int(time.time())
            })
            return idx

        if time.time() - post_info['time'] > 600:
            self.storage.remove(sid)
            return None

        return idx

    def get_shared_post(self, sid):
        pid = self.get_shared(sid)
        if pid:
            return post_manager.find_post(pid)
        return None

    def share_post(self, pid, role):
        post = post_manager.get_db_post(pid)
        if post:
            if role + 1 >= post.secret:
                return self.new_shared(pid)

        return None
