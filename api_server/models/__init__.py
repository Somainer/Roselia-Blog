from flask import Flask
# from flask.ext.sqlalchemy import SQLAlchemy
from flask_sqlalchemy import SQLAlchemy
from config import DB_PATH, DEBUG
import functools


class DBModelInjector:
    def __init__(self, app: Flask=None):
        self.app = None
        if app:
            self.set_app(app)
        self.db = SQLAlchemy()

    def set_app(self, app: Flask):
        self.app = app
        self.app.config['SQLALCHEMY_DATABASE_URI'] = DB_PATH
        self.app.config['SQLALCHEMY_ECHO'] = DEBUG
        return self

    def inject(self):
        self.db.init_app(self.app)
        with self.app.app_context():
            self.db.create_all()

    def context(self):
        return self.app.app_context()


    @property
    def Model(self):
        return self.db.Model


database = DBModelInjector()

db = database.db


def db_mutation_cleanup(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            raise e  # Re-raise the exception, no need to handle.
        finally:
            db.session.remove()

    return wrapper
