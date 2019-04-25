from models.all import Comment, db, User
from models import db_mutation_cleanup
from controller.UserManager import UserManager
from controller.PostManager import PostManager

post_manager = PostManager()


class CommentManager:
    @classmethod
    @db_mutation_cleanup
    def add_comment(cls, to_post, content, to_comment, from_user=None, nickname=None):
        user = None
        if from_user:
            user = UserManager.find_user(from_user)
            if not user:
                return False, 'Invalid user.'
        post = post_manager.get_db_post(to_post)
        if post is None:
            return False, 'Invalid post.'
        if not post.enable_comment and user is None:
            return False, 'You are not allowed to comment.'
        comment = Comment(
            to_article=post.post_id,
            reply_to=to_comment,
            content=content,
            from_user=user and user.user_id,
            nickname=nickname
        )
        db.session.add(comment)
        db.session.commit()
        return True, comment.comment_id

    @classmethod
    def can_delete_comment(cls, user, author):
        if not author:
            return user.role
        if user.user_id == author.user_id:
            return True
        return user.role > author.role

    @classmethod
    @db_mutation_cleanup
    def delete_comment(cls, comment_id, by_user):
        user = UserManager.find_user(by_user)
        if user is None:
            return False

        comment = Comment.query.get(comment_id)
        post = comment.post
        author = comment.author
        
        if not cls.can_delete_comment(user, author):
            return False

        db.session.delete(comment)
        db.session.commit()
        return True

    @classmethod
    @db_mutation_cleanup
    def force_delete_comment(cls, comment_id):
        comment = Comment.query.get(comment_id)
        
        if not comment:
            return False

        db.session.delete(comment)
        db.session.commit()
        return True

    @classmethod
    def get_comments(cls, post_id, limit=None, offset=None):
        query = Comment.query.filter(Comment.to_article == post_id).order_by(Comment.comment_id.desc())
        if limit is None and offset is None:
            return [q.dict for q in query.all()]

        return [q.dict for q in query.limit(limit or 0) \
            .offset(offset or 0).all()]

    @classmethod
    def get_comment_count(cls, post_id):
        return Comment.query.filter(Comment.to_article == post_id).count()

    @classmethod
    def get_comment(cls, comment_id):
        comment = Comment.query.get(comment_id)
        if comment:
            return comment.dict
