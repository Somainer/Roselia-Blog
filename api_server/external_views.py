from RoseliaGBP.view import bp as roselia_gbp_view

views = [roselia_gbp_view]


def register_views(app):
    for v in views:
        app.register_blueprint(v)
