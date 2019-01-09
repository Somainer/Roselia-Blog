from RoseliaGBP.view import bp as roselia_gbp_view
from views.User import user_view
from views.Comment import comment_view

views = [roselia_gbp_view, user_view, comment_view]


def register_views(app):
    for v in views:
        app.register_blueprint(v)
