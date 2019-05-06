from . import database, db
from sqlalchemy.sql import func
# from CodeHighLighter import markdown
from GFMarkDown import markdown
from lxml.html.clean import clean_html


class Comment(database.Model):
    comment_id = db.Column(db.Integer, primary_key=True)
    to_article = db.Column(db.Integer, db.ForeignKey('post.post_id'))
    reply_to = db.Column(db.Integer, db.ForeignKey('comment.comment_id'))
    content = db.Column(db.Text, nullable=False)
    nickname = db.Column(db.String(32), nullable=True)
    from_user = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=True)
    create_at = db.Column(db.DateTime, server_default=func.now())
    author = db.relationship(
        'User',
        uselist=False,
        backref='comment'
    )
    # post = db.relationship(
    #     'Post',
    #     uselist=False
    # )

    def __init__(self, **kwargs):
        self.to_article = kwargs.get('to_article')
        self.reply_to = kwargs.get('reply_to')
        self.content = clean_html(markdown(kwargs.get('content')))
        self.from_user = kwargs.get('from_user')
        self.nickname = kwargs.get('nickname')

    @property
    def dict(self):
        return {
            'id': self.comment_id,
            'to_article': self.to_article,
            'reply_to': self.reply_to,
            'content': self.content,
            'nickname': self.nickname,
            'author': self.author and self.author.dict,
            'created_at': self.create_at
        }
