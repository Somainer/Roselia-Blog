import PipeLine
from controller.UserManager import UserManager
from controller.PostManager import PostManager
from models.all import Post, db, database
from models import db_mutation_cleanup
import datetime


@db_mutation_cleanup
def migrate_user():
    old_um = PipeLine.ManagerAccount()

    user_list = sorted(old_um.get_all_user(233), key=lambda x: x['id'])

    for u in user_list:
        state = UserManager.add_user(u['username'], '123456', u['role'])
        print('Adding user:', u['username'], state)


@db_mutation_cleanup
def migrate_post():
    old_pm = PipeLine.PostManager()
    pm = PostManager()
    posts = old_pm.get_all()
    for k, v in posts.items():
        v['tags'] = list(map(pm.ensure_tag, v['tags']))
        post = Post(**v, owner=1)
        post.post_id = v['id']
        date = datetime.datetime.utcfromtimestamp(v['time'])
        post.create_time = date
        post.last_edit_time = date
        try:
            db.session.add(post)
            db.session.commit()
        except Exception as e:
            db.session.remove()
            post.display_id = None
            db.session.add(post)
            db.session.commit()


def main():
    from api_server.api_server import app

    database.set_app(app).inject()

    app.app_context().push()
    migrate_user()
    migrate_post()


if __name__ == '__main__':
    main()
