from models.all import Post, db, database, Tag, Catalog, User
from models.user import Digest
from models import db_mutation_cleanup
from fn.monad import Option
from operator import *
from sqlalchemy.sql import operators as sql_ops
from sqlalchemy.sql import functions as sql_funcs
import pyotp


class UserManager:
    @classmethod
    def find_user_option(cls, by):
        return Option(
            User.query.get(by) if isinstance(by, int)
            else User.query.filter(sql_funcs.func.lower(User.username) == sql_funcs.func.lower(by)).first()
        )

    @classmethod
    def find_user(cls, by) -> User:
        return cls.find_user_option(by).get_or(None)

    @classmethod
    @db_mutation_cleanup
    def set_nickname(cls, user, nickname):
        user = cls.find_user(user)
        if not user:
            return False
        user.nickname = nickname
        db.session.commit()
        return True

    @classmethod
    def find_user_brief(cls, by):
        return cls.find_user_option(by).map(attrgetter('dict')).get_or(None)

    @classmethod
    @db_mutation_cleanup
    def add_user(cls, username, password, role, nickname=None, mail=None, avatar=''):
        try:
            user = User(username, password, role, nickname, mail, avatar)
            db.session.add(user)
            db.session.commit()
            return True
        except Exception as e:
            print(e)
            return False

    @classmethod
    def check_user(cls, username, password):
        user = cls.find_user_option(username).filter(lambda x: x.password == Digest.digest(password))
        return not user.empty, user.map(lambda x: x.role).get_or(-1)

    @classmethod
    def get_all_user(cls, level=0):
        return [x.dict for x in User.query.filter(User.role < level).all()]

    @classmethod
    @db_mutation_cleanup
    def force_set_password(cls, username, new_password, level=None):
        user = cls.find_user_option(username)
        if level is not None:
            user = user.filter(lambda x: x.role < level)

        if user.empty:
            return False

        user.map(lambda x: x.set_password(new_password))
        db.session.commit()

        return True

    @classmethod
    def change_password(cls, username, old_password, new_password):
        stat, _ = cls.check_user(username, old_password)
        if stat:
            cls.force_set_password(username, new_password)
        return stat

    @classmethod
    @db_mutation_cleanup
    def delete_user(cls, username, level=0):
        user = cls.find_user_option(username).filter(lambda x: x.role < level).get_or(None)
        if user:
            db.session.delete(user)
            db.session.commit()
        return user is not None

    @classmethod
    def get_user_meta(cls, username):
        user = cls.find_user_option(username).get_or(None)
        if not user:
            return False, None
        return True, user.username, user.role

    @classmethod
    def get_user_dict(cls, username):
        return cls.find_user_option(username).map(attrgetter('dict')).get_or(None)

    @classmethod
    def is_empty(cls):
        return User.query.count() == 0

    @classmethod
    @db_mutation_cleanup
    def bind_totp(cls, username):
        def do_bind(user):
            code = pyotp.random_base32()
            user.totp_code = code
            db.session.commit()
            totp = pyotp.TOTP(code)
            return {
                'code': code,
                'url': totp.provisioning_uri(user.username, 'Roselia Blog'),
                'nextCode': totp.now()
            }

        return cls.find_user_option(username)\
            .filter(lambda user: not user.totp_code)\
            .map(do_bind)\
            .get_or(None)

    @classmethod
    def check_totp(cls, username, code):
        return cls.find_user_option(username)\
            .map(lambda user: user.totp_code)\
            .filter(truth)\
            .map(pyotp.TOTP)\
            .map(methodcaller('verify', code))\
            .get_or(True)

    @classmethod
    @db_mutation_cleanup
    def remove_totp(cls, username, code):
        if not cls.check_totp(username, code):
            return False

        def do_remove(user):
            user.totp_code = None
            db.session.commit()

        cls.find_user_option(username).map(do_remove)
        return True

    @classmethod
    def has_totp(cls, username):
        return not cls.find_user_option(username)\
            .filter(lambda u: u.totp_code)\
            .empty
    
    @classmethod
    @db_mutation_cleanup
    def change_role(cls, username, role, by_role):
        if by_role <= role or role < 0:
            return False
        user = cls.find_user_option(username)\
            .filter(lambda u: u.role < by_role).get_or(None)
        
        if not user:
            return False
        
        user.role = role
        db.session.commit()
        return True
