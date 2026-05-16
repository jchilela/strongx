from loguru import logger

from app.core.database import AsyncSessionLocal


async def poll_pending_payments(ctx: dict) -> None:
    """Cron job: sync pending AppyPay payments every 2 minutes."""
    from app.modules.wallet.service import sync_pending_payments

    async with AsyncSessionLocal() as db:
        async with db.begin():
            try:
                synced = await sync_pending_payments(db)
                if synced:
                    logger.info(f"Payment poller: synced {synced} payment(s)")
            except Exception as exc:
                logger.exception(f"Payment poller error: {exc}")
