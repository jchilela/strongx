from typing import Optional

from arq import create_pool, cron
from arq.connections import ArqRedis, RedisSettings

from app.core.config import settings
from app.workers.sms_worker import send_sms_task
from app.workers.email_worker import send_email_task
from app.workers.whatsapp_worker import send_whatsapp_task
from app.workers.payment_poller import poll_pending_payments

_arq_pool: Optional[ArqRedis] = None


async def get_arq_pool() -> ArqRedis:
    global _arq_pool
    if _arq_pool is None:
        _arq_pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    return _arq_pool


class WorkerSettings:
    functions = [send_sms_task, send_email_task, send_whatsapp_task, poll_pending_payments]
    cron_jobs = [cron(poll_pending_payments, minute={0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58})]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    max_jobs = 10
    job_timeout = 60
