from sqlalchemy.orm import Session
from app.models.notification import Notification


def notify(db: Session, user_id: int, message: str, link: str | None = None):
    """Queue a notification for a user. Does not commit - the caller's existing commit() covers it."""
    db.add(Notification(user_id=user_id, message=message, link=link))