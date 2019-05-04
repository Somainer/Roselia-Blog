from models.all import Oauth, db, database
from models import db_mutation_cleanup
from .UserManager import UserManager
from fn.monad import Option


class OauthManager:
    @classmethod
    @db_mutation_cleanup
    def add_adapter(cls, username, adapter, oauth_user):
        user = UserManager.find_user_option(username)
        record = user.map(
            lambda u: Oauth.query.filter(Oauth.user == u).filter(Oauth.oauth_adapter == adapter).first()
        ).get_or(None)
        if record:
            db.session.delete(record)
        if user.empty:
            return False

        if Oauth.query.filter(Oauth.oauth_adapter == adapter).filter(Oauth.embedding_user == oauth_user).count():
            return False
        
        cls._force_add_record(user.get_or(None), adapter, oauth_user)
        return True

    @classmethod
    def _force_add_record(cls, user, adapter, oauth_user):
        oauth = Oauth()
        oauth.user_id = user.user_id
        oauth.oauth_adapter = adapter
        oauth.embedding_user = oauth_user
        db.session.add(oauth)
        db.session.commit()

    @classmethod
    def get_embedding_user(cls, adapter, embedding):
        return Option(Oauth.query \
                      .filter(Oauth.oauth_adapter == adapter) \
                      .filter(Oauth.embedding_user == embedding) \
                      .first()) \
            .map(lambda x: x.user.username) \
            .get_or(None)

    @classmethod
    def get_adapters(cls, user):
        return UserManager \
            .find_user_option(user) \
            .map(lambda u: Oauth.query.filter(Oauth.user == u).all()) \
            .map(lambda l:
                 map(lambda x: {
                     'adapter': x.oauth_adapter,
                     'user': x.embedding_user
                 }, l)) \
            .map(list).get_or([])

    @classmethod
    @db_mutation_cleanup
    def remove_adapters(cls, user, adapter):
        found = UserManager.find_user_option(user).map(
            lambda u: Oauth.query.filter(Oauth.user == u).filter(Oauth.oauth_adapter == adapter).all()
        )
        if not found.empty:
            for x in found.get_or([]):
                db.session.delete(x)
            db.session.commit()
        return not found.empty
