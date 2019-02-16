from models.all import db
from api_server import app


def add_totp():
    app.app_context().push()
    db.session.execute('ALTER TABLE user ADD COLUMN totp_code varchar(64)')
    db.session.commit()
