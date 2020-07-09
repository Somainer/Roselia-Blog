from models.all import PluginStorage
from fn.monad import Option
from models import db_mutation_cleanup, db
from controller.UserManager import UserManager


class PluginStorageManager:
    @classmethod
    def get_user_id(cls, username):
        return Option(username) \
            .map(UserManager.find_user) \
            .map(lambda x: x.user_id) \
            .get_or(None)

    @classmethod
    def raw_query(cls, application: str, key: str, username: str = None) -> PluginStorage:
        user = cls.get_user_id(username)
        return PluginStorage.query \
            .filter(PluginStorage.application == application) \
            .filter(PluginStorage.key == key) \
            .filter(PluginStorage.user == user)

    @classmethod
    def search_records(cls, application: str, index_key: str, username: str = None, get_all=True):
        query = PluginStorage.query \
            .filter(PluginStorage.application == application) \
            .filter(PluginStorage.index_key == index_key)
        if not get_all:
            query = query.filter(PluginStorage.user == cls.get_user_id(username))
        return [
            x.get_dict() for x in query.all()
        ]

    @classmethod
    def get_content(cls, application: str, key: str, username):
        result = cls.raw_query(application, key, username) \
            .first()
        return result and result.get_dict()

    @classmethod
    @db_mutation_cleanup
    def new_record(cls, application: str, key: str, value: str, username=None, index_key=None):
        user = Option(username).map(UserManager.find_user).get_or(None)
        if username:
            record = cls.raw_query(application, key, username)
        else:
            record = cls.raw_query(application, key)
        if record.count():
            return False
        record = PluginStorage()
        if user:
            record.user = user.user_id
        record.application = application
        record.key = key
        record.index_key = index_key
        record.content = value
        db.session.add(record)
        db.session.commit()
        return True

    @classmethod
    @db_mutation_cleanup
    def edit_record(cls, application: str, key: str, value: str = None, username=None, index_key=None):
        record = cls.raw_query(application, key, username).first()
        if record:
            if value is not None:
                record.content = value
            if index_key is not None:
                record.index_key = index_key
            db.session.commit()
        return record is not None
    
    @classmethod
    @db_mutation_cleanup
    def upsert_record(cls, application: str, key: str, value: str = None, username=None, index_key=None):
        record = cls.raw_query(application, key, username).first()
        if record:
            return cls.edit_record(application, key, value, username, index_key)
        return cls.new_record(application, key, value, username, index_key)

    @classmethod
    @db_mutation_cleanup
    def delete_record(cls, application: str, key: str, username: str = None):
        record = cls.raw_query(application, key, username).first()
        if record:
            db.session.delete(record)
            db.session.commit()
        return record is not None

    @classmethod
    @db_mutation_cleanup
    def remove_application(cls, application):
        records = PluginStorage.query \
            .filter(PluginStorage.application == application)
        db.session.delete(records)
        db.session.commit()
        return not not records

    @classmethod
    @db_mutation_cleanup
    def delete_by_index(cls, application: str, index_key: str, all_user: bool, username: str = None):
        query = PluginStorage.query \
            .filter(PluginStorage.application == application) \
            .filter(PluginStorage.index_key == index_key)

        if all_user:
            if not UserManager.is_master(username):
                return False
        if not all_user:
            query = query.filter(PluginStorage.user == cls.get_user_id(username))

        db.session.delete(query)
        db.session.commit()
        return True
