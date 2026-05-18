from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.webhooks import appypay, sendgrid, strongpay, twilio

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/strongpay")
async def strongpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await strongpay.handle_strongpay_webhook(request, db)


@router.post("/appypay")
async def appypay_webhook(
    request: Request,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await appypay.handle_appypay_webhook(request, db, token)


@router.post("/twilio")
async def twilio_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await twilio.handle_twilio_webhook(request, db)


@router.post("/sendgrid")
async def sendgrid_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await sendgrid.handle_sendgrid_webhook(request, db)
