from . import database
from GFMarkDown import markdown
from datetime import datetime
from .relations import post_catalog, post_tag
from sqlalchemy.sql import func
from .user import User

db = database.db


class Post(db.Model):
    post_id = db.Column(db.Integer, primary_key=True)
    display_id = db.Column(db.Text, unique=True)
    title = db.Column(db.String)
    subtitle = db.Column(db.Text, default='')
    content = db.Column(db.Text, default='')
    md_content = db.Column(db.Text, default='')
    create_time = db.Column(db.DateTime, server_default=func.now())
    last_edit_time = db.Column(db.DateTime, server_default=func.now(), onupdate=func.now())
    owner = db.Column(db.Integer, db.ForeignKey('user.user_id'))
    cover = db.Column(db.Text)
    secret = db.Column(db.Integer, nullable=False, default=0)
    hidden = db.Column(db.Boolean, nullable=False, default=False)
    dark_title = db.Column(db.Boolean, nullable=False, default=False)
    enable_comment = db.Column(db.Boolean, nullable=False, default=True)
    catalogs = db.relationship(
        'Catalog',
        secondary=post_catalog,
        backref='post'
    )
    author = db.relationship(
        'User',
        uselist=False,
        backref='post'
    )
    tag = db.relationship(
        'Tag',
        secondary=post_tag,
        backref='post'
    )

    comments = db.relationship(
        'Comment',
        backref='post',
        cascade='all,delete'
    )

    def __init__(self, **kwargs):
        self.title = kwargs['title']
        self.display_id = kwargs.get('display_id', self.title) or None
        self.subtitle = kwargs.get('subtitle', '')
        content = kwargs.get('content')
        md_content = kwargs.get('md_content')
        if content is None and md_content:
            content = markdown(md_content)
        self.content = content
        self.md_content = md_content
        if 'owner' in kwargs:
            self.owner = kwargs['owner']
        if 'author' in kwargs:
            self.author = kwargs['author']
        self.cover = kwargs.get('cover', '')
        self.secret = kwargs.get('secret', 0)
        self.dark_title = kwargs.get('dark_title', False)
        self.enable_comment = kwargs.get('enable_comment', True)
        self.tag = kwargs.get('tags', [])
        self.catalogs = kwargs.get('catalogs', [])

    @property
    def dict(self):
        return {
            'id': self.post_id,
            'display_id': self.display_id,
            'title': self.title,
            'subtitle': self.subtitle,
            'content': self.content,
            'md_content': self.md_content,
            'created': self.create_time,
            'last_edit': self.last_edit_time,
            'date': self.create_time.strftime('%b %d, %Y'),
            'img': self.cover,
            'dark_title': self.dark_title,
            'enable_comment': self.enable_comment,
            'author': self.author and self.author.dict,
            'secret': self.secret,
            'hidden': self.hidden,
            'tags': [x.tag_name for x in self.tag],
            'catalogs': [x.catalog_name for x in self.catalogs]
        }

    @property
    def brief_dict(self):
        return {
            'id': self.post_id,
            'display_id': self.display_id,
            'title': self.title,
            'subtitle': self.subtitle,
            'created': self.create_time,
            'date': self.create_time.strftime('%b %d, %Y'),
            'last_edit': self.last_edit_time,
            'img': self.cover,
            'dark_title': self.dark_title,
            'enable_comment': self.enable_comment,
            'author': self.author and self.author.dict,
            'secret': self.secret,
            'hidden': self.hidden,
            'tags': [x.tag_name for x in self.tag],
            'catalogs': [x.catalog_name for x in self.catalogs]
        }

    modify_forbidden_attrs = {
        'created', 'last_edit', 'author', 'post_id', 'id'
    }
