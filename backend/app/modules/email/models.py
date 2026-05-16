# Email module reuses the Message model from sms.models with channel='email'
# Import it here for convenience
from app.modules.sms.models import Message

__all__ = ["Message"]
