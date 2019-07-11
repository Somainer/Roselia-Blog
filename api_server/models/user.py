from . import database, db
import hashlib
import binascii


class User(database.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(16), unique=True)
    password = db.Column(db.String(72))
    nickname = db.Column(db.String(72))
    role = db.Column(db.Integer, nullable=False)
    mail = db.Column(db.String(64), unique=True)
    avatar = db.Column(db.String(256))
    totp_code = db.Column(db.String(64))
    banner = db.Column(db.String(256))
    motto = db.Column(db.String(256))

    def __repr__(self):
        return '<User {}>'.format(self.username)

    @property
    def dict(self):
        return {
            'id': self.user_id,
            'username': self.username,
            'role': self.role,
            'nickname': self.nickname,
            'mail': self.mail,
            'avatar': self.avatar
        }
    
    @property
    def full_dict(self):
        return {
            'id': self.user_id,
            'username': self.username,
            'role': self.role,
            'nickname': self.nickname,
            'mail': self.mail,
            'avatar': self.avatar,
            'totp': not not self.totp_code,
            'banner': self.banner,
            'motto': self.motto
        }

    def set_password(self, password):
        self.password = Digest.digest(password)

    def __init__(self, username, password, role, nickname=None, mail=None, avatar=''):
        self.username = username
        self.nickname = nickname or username
        self.password = Digest.digest(password)
        self.role = role
        self.mail = mail
        self.avatar = avatar


class Digest(object):
    prefix = 'ZJUw$p'
    suffix = 'qmmlw$p20'
    hash_salt = prefix + suffix

    hash_func = hashlib.sha256

    @classmethod
    def need_byte(cls, pld):
        return pld if isinstance(pld, bytes) else pld.encode()

    @classmethod
    def add_salt(cls, password):
        # return f'{cls.prefix}{password}{len(password)}{cls.suffix}'
        return '{}{}{}{}'.format(cls.prefix, password, len(password), cls.suffix)

    @classmethod
    def digest(cls, password):
        return cls.hash_func(cls.add_salt(password).encode()).hexdigest()

    # @classmethod
    # def bcrypt_digest(cls, password):
    #     return binascii.hexlify(bcrypt.kdf(
    #         cls.need_byte(password), cls.need_byte(cls.hash_salt), 32, 100
    #     ))
