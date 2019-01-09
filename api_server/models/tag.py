from . import db, database


class Tag(database.Model):
    tag_id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    tag_name = db.Column(db.String(64), unique=True)

    def __init__(self, name):
        self.tag_name = name.replace(' ', '-')
