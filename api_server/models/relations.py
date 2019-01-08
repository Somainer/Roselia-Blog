from . import database, db


post_catalog = db.Table(
    'post_catalogs',
    db.Column('post_id', db.ForeignKey('post.post_id')),
    db.Column('catalog_id', db.ForeignKey('catalog.catalog_id'))
)

post_tag = db.Table(
    'post_tags',
    db.Column('post_id', db.ForeignKey('post.post_id')),
    db.Column('tag_id', db.ForeignKey('tag.tag_id'))
)
