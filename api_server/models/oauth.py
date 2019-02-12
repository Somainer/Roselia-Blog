from . import database, db


class Oauth(database.Model):
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), primary_key=True)
    oauth_adapter = db.Column(db.Text, primary_key=True)
    embedding_user = db.Column(db.Text)
    user = db.relationship(
        'User',
        uselist=False
    )
