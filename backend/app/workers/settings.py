from typing import Optional

from arq import create_pool
from arq.connections import ArqRedis, RedisSettings

from app.core.config import settings
from app.workers.sms_worker import send_sms_task
from app.workers.email_worker import send_email_task
from app.workers.whatsapp_worker import send_whatsapp_task

_arq_pool: Optional[ArqRedis] = None


async def get_arq_pool() -> ArqRedis:
    global _arq_pool
    if _arq_pool is None:
        _arq_pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    return _arq_pool


class WorkerSettings:
    functions = [send_sms_task, send_email_task, send_whatsapp_task]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    max_jobs = 10
    job_timeout = 60
