from models.all import PluginStorage
from fn.monad import Option
from models import db_mutation_cleanup
from controller.UserManager import UserManager

class PluginStorageManager:
    @classmethod
    def raw_query(cls, application: str, key: str, username: str = None) -> PluginStorage:
        user = Option(username).map(UserManager.find_user).map(lambda x: x.user_id).get_or(None)
        return PluginStorage.query\
            .filter(PluginStorage.application == application)\
            .filter(PluginStorage.key == key)\
            .filter(PluginStorage.user == user)
    
    @classmethod
    def 

    @classmethod
    def get_content(cls, application: str, key: str, username):
        result = cls.raw_query(application, key, username)\
            .first()
        return result and result.content

    @classmethod
    @db_mutation_cleanup
    def new_record(cls, application: str, key: str, value: str, username = None, index_key = None):
        record = cls.raw_query(application, key)
        if record:
            return False
        user = Option(username).map(UserManager.find_user).get_or(None)
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
    def set_content(cls, application: str, key: str, value: str, username = None, index_key = None):
        record = cls.raw_query(application, key, username)
        if record:
            record.content = value
        db.session.commit()
