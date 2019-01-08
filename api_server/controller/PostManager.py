from models.all import Post, db, database, Tag, Catalog, User, post_tag, post_catalog
from models import db_mutation_cleanup
from fn.monad import Option
from operator import *
from sqlalchemy.sql import operators as sql_ops
from sqlalchemy.sql import functions as sql_funcs
from CodeHighLighter import markdown
from controller.UserManager import UserManager


class PostManager:
    def get_db_post(self, pid) -> Post:
        return Option(
            Post.query.filter(sql_funcs.func.lower(Post.display_id) == sql_funcs.func.lower(pid)).first() if isinstance(
                pid, str)
            else Post.query.get(pid)).get_or(None)

    def find_post(self, pid, need_md=False):
        post = self.get_db_post(pid)
        # print(post['author'])

        if not post:
            return None

        post = post.dict

        md = post.get('md_content', '')
        post.pop('md_content')
        if need_md and len(md):
            post['content'] = md
        return post

    def get_prev(self, pid, level=0):
        data = Post.query \
            .filter(sql_ops.and_(Post.post_id < pid, Post.secret <= level)) \
            .filter(~Post.hidden) \
            .order_by(Post.post_id.desc()).limit(1).first()

        if not data:
            return -1
        return data.post_id

    def get_next(self, pid, level=0):
        data = Post.query \
            .filter(sql_ops.and_(Post.post_id > pid, Post.secret <= level)) \
            .filter(~Post.hidden) \
            .order_by(Post.post_id.asc()).limit(1).first()

        if not data:
            return -1
        return data.post_id

    def ensure_tag(self, tag_name):
        tag = self.find_tag(tag_name)
        if tag:
            return tag
        tag = Tag(tag_name)
        db.session.add(tag)
        db.session.commit()
        return tag

    def find_tag(self, tag_name):
        tag_name = Tag(tag_name).tag_name
        return Tag.query.filter(sql_funcs.func.lower(Tag.tag_name) == sql_funcs.func.lower(tag_name)).first()

    def find_catalog(self, catalog_name):
        return Catalog.query \
            .filter(sql_funcs.func.lower(Catalog.catalog_name) == sql_funcs.func.lower(catalog_name)).first()

    def find_catalog_by_link(self, catalog_link):
        return Catalog.query \
            .filter(sql_funcs.func.lower(Catalog.catalog_eternal_link) == sql_funcs.func.lower(catalog_link)).first()

    @db_mutation_cleanup
    def add_post(self, post, owner, fmt_md=False):
        if not isinstance(post, dict):
            return False
        # if not all(i in keys for i in post.keys()): return False
        # post = {
        #     k: v for k, v in post.items() if k in self.keys
        # }
        secret = int(post.get('secret', 0))
        author = UserManager.find_user(owner)  # type: User
        if not author or author.role + 1 < secret:
            return False
        if fmt_md:
            post['md_content'] = post['content']
            post['content'] = markdown(post['content'])
        tags = list(map(self.ensure_tag, post.get('tags', [])))
        catalogs = list(filter(truth, map(self.find_catalog, post.get('catalog', []))))
        cnv_dict = {
            'title': post.get('title', 'Untitled'),
            'subtitle': post.get('subtitle', ''),
            'display_id': post.get('display_id', post.get('title')),
            'content': post.get('content', ''),
            'author': author,
            'img': post.get('img', ''),
            'tags': tags,
            'secret': secret,
            'catalogs': catalogs,
            'md_content': post.get('md_content', ''),
            'enable_comment': post.get('enable_comment', True)
        }
        insert_post = Post(**cnv_dict)
        db.session.add(insert_post)
        db.session.commit()

        return True

    @db_mutation_cleanup
    def edit_post(self, pid, post, role, fmt_md=False):
        if not isinstance(post, dict):
            return False
        # if not all(k in self.keys for k in post.keys()): return False
        # print("Format_MD:", fmt_md)
        db_post = Post.query.get(pid)  # type: Post
        if db_post.author.role > role:
            return False
        if fmt_md and post.get('content'):
            post['md_content'] = post['content']
            post['content'] = markdown(post['content'])
        if not post.get('display_id'):
            post['display_id'] = None
        tags = list(map(self.ensure_tag, post.pop('tags', [])))
        for k in db_post.__dir__():
            if not k.startswith('_') and k in post and k not in Post.modify_forbidden_attrs:
                setattr(db_post, k, post[k])
        db_post.tag = tags
        db.session.commit()

        return True

    def get_posts(self, offset, count=None, level=0, tag=None, catalog=None):
        if count is None:
            count = offset
            offset = 0

        query = Post.query \
            .filter(Post.secret <= level) \
            .filter(~Post.hidden)

        if tag:
            tag = self.find_tag(tag)
            if tag is None:
                return []
            query = query \
                .join(post_tag) \
                .filter(post_tag.c.post_id == Post.post_id) \
                .filter(post_tag.c.tag_id == tag.tag_id)

        if catalog:
            catalog = self.find_catalog(catalog) or self.find_catalog_by_link(catalog)
            if not catalog:
                return []
            query = query \
                .join(post_catalog) \
                .filter(post_catalog.c.post_id == Post.post_id) \
                .filter(post_catalog.c.catalog_id == catalog.catalog_id)

        return [x.brief_dict
                for x in query
                    .order_by(Post.post_id.desc())
                    .limit(count)
                    .offset(offset).all()]

    def get_all_posts(self, level=0):
        return [x.brief_dict for x in Post.query \
            .filter(Post.secret <= level) \
            .filter(~Post.hidden) \
            .order_by(Post.post_id.desc())]

    def get_count(self, level=0):
        return Post.query.filter(Post.secret <= level).count()

    @db_mutation_cleanup
    def remove_post(self, pid, level=0):
        post = Post.query.join(User) \
            .filter(Post.post_id == pid) \
            .filter(Post.owner == User.user_id) \
            .filter(User.role <= level).first()

        if post is None:
            return False

        db.session.delete(post)
        db.session.commit()

        return True


if __name__ == '__main__':
    from api_server.api_server import app

    database.set_app(app).inject()

    app.app_context().push()
    pm = PostManager()
