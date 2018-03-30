import sqlite3
import hashlib
import os
import datetime
import time
from Logger import log
from config import DB_POST, DB_USER

from CodeHighLighter import markdown

class ManagerAccount:
    def __init__(self):
        self.Prefix = "wsp"
        self.Suffix = "9mm1WSp"
        self.DBName = DB_USER
        self.table_name = 'Users'
        self.check_existence()

    def create_database(self):
        with sqlite3.connect(self.DBName) as connection:
            cursor = connection.cursor()
            cursor.execute(r'create table IF NOT EXISTS {} (id integer primary key autoincrement, username text, password text, role integer)'.format(self.table_name))
            cursor.close()
            connection.commit()

    def check_existence(self):
        if not os.path.exists(self.DBName):
            self.create_database()

    def SHA256Encrypt(self, origin_password):
        fixed_string = self.Prefix + origin_password + self.Suffix + str(len(origin_password))
        return str(hashlib.sha256(fixed_string.encode()).hexdigest()).upper()

    def add_user(self, username, password, role=1):
        if not self.check_duplicate(username):
            return False
        with sqlite3.connect(self.DBName) as connection:
            cursor = connection.cursor()
            cursor.execute(r"insert into {}(username, password, role) VALUES ('{}', '{}', {})".format(self.table_name, username, self.SHA256Encrypt(password), role))
            cursor.close()
            connection.commit()
        return True

    def check_duplicate(self, username):
        with sqlite3.connect(self.DBName) as connection:
            cursor = connection.cursor()
            cursor.execute('select * from {} WHERE lower(username)=lower(?)'.format(self.table_name), (username,))
            data = cursor.fetchone()
            cursor.close()
        return not data

    def force_change_password(self, username, new_password, level=None):
        if self.check_duplicate(username):
            return False
        with sqlite3.connect(self.DBName) as connection:
            cursor = connection.cursor()
            if level is None:
                cursor.execute('update {} set password=? where LOWER(username)=LOWER(?)'.format(self.table_name), (
                    self.SHA256Encrypt(new_password), username
                ))
            else:
                cursor.execute('update {} set password=? where LOWER(username)=LOWER(?) and role < ?'.format(self.table_name), (
                    self.SHA256Encrypt(new_password), username, level
                ))
            cursor.close()
            connection.commit()
        return True

    def change_password(self, username, old_password, new_password):
        state, code = self.check_user(username, old_password)
        if not state:
            return False
        return self.force_change_password(username, new_password)

    def get_all_user(self, level=0):
        with sqlite3.connect(self.DBName) as connection:
            cursor = connection.cursor()
            cursor.execute('select * from {} WHERE role < ?'.format(self.table_name), (level,))
            data = cursor.fetchall()
            cursor.close()
        if not data: return []
        interests = {
            0: 'id', 1: 'username', 3: 'role'
        }
        return [{
            key: user[idx] for idx, key in interests.items()
        } for user in data]

    def delete_user(self, username, level=1):
        with sqlite3.connect(self.DBName) as connection:
            cursor = connection.cursor()
            cursor.execute('delete from {} where LOWER(username)=LOWER(?) and role < ?'.format(self.table_name), (
                username, level
            ))
            cursor.close()
            connection.commit()

    def check_user(self, username, password):
        with sqlite3.connect(self.DBName) as connection:
            cursor = connection.cursor()
            cursor.execute('select * from {} WHERE LOWER(username)=lower(?)'.format(self.table_name), (username,))
            data = cursor.fetchone()
            cursor.close()
        if not data:
            return False, -1
        if data[2] == self.SHA256Encrypt(password):
            return True, data[3]
        return False, -1

    def is_empty(self):
        with sqlite3.connect(self.DBName) as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT count(*) FROM {}".format(self.table_name))
            data = cursor.fetchone()
            cursor.close()
        return data[0] == 0

class PostManager:
    def __init__(self):
        self.DB_name = DB_POST
        self.table_name = 'Posts'
        self.keys = [
            'title',
            'subtitle',
            'content',
            'time',
            'tags',
            'img', 'secret', 'md_content'
        ]
        self.check_existence()

    def check_existence(self):
        if not os.path.exists(self.DB_name):
            self.create_database()

    def create_database(self):
        with sqlite3.connect(self.DB_name) as connection:
            cursor = connection.cursor()
            cursor.execute(
                r'create table IF NOT EXISTS {} (id integer primary key autoincrement,'.format(self.table_name) +
                r' title text, subtitle text, ' +
                r'content text, ' +
                r'time integer, ' +
                r'tags text,' +
                r'img text,' +
                r'secret integer,'
                r'md_content text)')
            cursor.close()
            connection.commit()

    def tuple_to_dict(self, tup):
        data_dict = {k: v for k, v in zip(['id'] + self.keys, tup)}
        data_dict['tags'] = eval(data_dict.get('tags', '[]'))
        time_sp = data_dict['time']
        month = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        time_tp = time.localtime(time_sp)
        data_dict['date'] = '{} {}, {}'.format(month[time_tp.tm_mon], time_tp.tm_mday, time_tp.tm_year)
        return data_dict

    def brief_dict(self, tup):
        data_dict = {k: v for k, v in zip(['id'] + self.keys, tup)}
        data_dict['tags'] = eval(data_dict.get('tags', '[]'))
        time_sp = data_dict['time']
        data_dict['date'] = datetime.datetime.fromtimestamp(time_sp).strftime('%b %d, %Y')
        if "content" in data_dict:
            data_dict.pop('content')
        return data_dict

    def execute_query(self, query_str, *args):
        with sqlite3.connect(self.DB_name) as connection:
            cursor = connection.cursor()
            cursor.execute(query_str, args)
            data = cursor.fetchall()
            cursor.close()
        return data

    def execute_non_query(self, query_str, *args):
        with sqlite3.connect(self.DB_name) as connection:
            cursor = connection.cursor()
            cursor.execute(query_str, args)
            cursor.close()
            connection.commit()

    def find_post(self, pid, need_md=False):
        with sqlite3.connect(self.DB_name) as connection:
            cursor = connection.cursor()
            cursor.execute('select * from {} WHERE id=?'.format(self.table_name), (pid,))
            data = cursor.fetchone()
            cursor.close()
        if not data:
            return None
        data_dict = self.tuple_to_dict(data)
        md = data_dict.get('md_content', '')
        data_dict.pop('md_content')
        if need_md and len(md):
            data_dict['content'] = md
        return data_dict

    def get_prev(self, pid, level=0):
        data = self.execute_query('select * from {} WHERE id < ? AND secret <= ? ORDER BY id DESC limit 0, 1'.format(self.table_name), pid, level)
        if not data:
            return -1
        return data[0][0]

    def get_next(self, pid, level=0):
        data = self.execute_query('select * from {} WHERE id > ? AND secret <= ? ORDER BY id limit 0, 1'.format(self.table_name), pid, level)
        if not data:
            return -1
        return data[0][0]

    def add_post(self, post, fmt_md=False):
        if not isinstance(post, dict):
            return False
        keys = self.keys
        if not all(i in keys for i in post.keys()): return False
        if fmt_md:
            post['md_content'] = post['content']
            post['content'] = markdown(post['content'])
        cnv_dict = {
            'title': post.get('title', 'Untitled'),
            'subtitle': post.get('subtitle', ''),
            'content': post.get('content', ''),
            'time': int(datetime.datetime.now().timestamp()),
            'tags': str(post.get('tags', [])),
            'img': post.get('img', ''),
            'secret': int(post.get('secret', 0)),
            'md_content': post.get('md_content', '')
        }
        arg_list = ['{}'.format(cnv_dict[k]) for k in keys]
        #print(','.join(arg_list))
        with sqlite3.connect(self.DB_name) as connection:
            cursor = connection.cursor()
            cursor.execute('insert into {}({}) VALUES ({})'
                           .format(self.table_name, ','.join(keys), ','.join('?' * len(arg_list))),
                           arg_list)
            cursor.close()
            connection.commit()
        return True

    def edit_post(self, pid, post, fmt_md=False):
        if not isinstance(post, dict): return False
        if not all(k in self.keys for k in post.keys()): return False
        print("Format_MD:", fmt_md)
        if fmt_md and post.get('content'):
            post['md_content'] = post['content']
            post['content'] = markdown(post['content'])
        if isinstance(post.get('tags', []), list):
            post['tags'] = str(post.get('tags', []))
        edit_str = ','.join('{}=?'.format(k) for k in post.keys())
        with sqlite3.connect(self.DB_name) as connection:
            cursor = connection.cursor()
            cursor.execute('update {} set {} where id={}'.format(self.table_name, edit_str, pid), list(post.values()))
            cursor.close()
            connection.commit()
        return True

    def get_posts(self, offset, count=None, level=0):
        if count is None:
            count = offset
            offset = 0
        return [self.brief_dict(p)
                for p in self.execute_query('select * from {} WHERE secret <= ? order BY id DESC limit ?,?'.format(self.table_name), level, offset, count)]

    def get_all(self):
        with sqlite3.connect(self.DB_name) as connection:
            cursor = connection.cursor()
            cursor.execute('select * from {}'.format(self.table_name))
            data = cursor.fetchall()
            cursor.close()
        return {
            d[0]: self.tuple_to_dict(d) for d in data
        }

    def get_all_brief(self):
        brief_key = ['id', 'title', 'subtitle', 'date', 'tags', 'img', 'secret']
        return [
            {
                key: v[key] for key in brief_key
            } for k, v in self.get_all().items()
        ]

    def get_count(self, level=0):
        return self.execute_query('select count(*) from {} WHERE secret <= ?'.format(self.table_name), level)[0][0]

    def remove_post(self, pid):
        self.execute_non_query('delete from {} WHERE id=?'.format(self.table_name), pid)



if __name__ == '__main__':
    pm = PostManager()
    print(pm.get_all_brief())