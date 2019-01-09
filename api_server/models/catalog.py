from . import database, db


class Catalog(database.Model):
    catalog_id = db.Column(db.Integer, primary_key=True)
    catalog_eternal_link = db.Column(db.String(32), unique=True)
    catalog_name = db.Column(db.String(64), unique=True)

    def __init__(self, name, eternal_link=None):
        self.catalog_name = name.replace(' ', '')
        self.catalog_eternal_link = eternal_link or self.catalog_name
