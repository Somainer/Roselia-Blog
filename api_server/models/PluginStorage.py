from . import database, db
from sqlalchemy.sql import func


class PluginStorage(database.Model):
    application = db.Column(db.String(64), nullable=False)
    user = db.Column(db.Integer, db.ForeignKey('user.user_id'))

    index_key = db.Column(db.String(64))

    key = db.Column(db.String(64), nullable=False, unique=True)
    content = db.Column(db.Text)

    create_time = db.Column(db.DateTime, server_default=func.now())
    last_edit_time = db.Column(db.DateTime, server_default=func.now(), onupdate=func.now())

    target_user = db.relationship(
        'User',
        uselist=False,
        backref=db.backref('plugins', cascade='all, delete')
    )

    def get_dict(self):
        return {
            'application': self.application,
            'user': self.user,
            'index': self.index_key,
            'key': self.key,
            'content': self.content,
            'created': self.create_time,
            'edited': self.last_edit_time
        }
