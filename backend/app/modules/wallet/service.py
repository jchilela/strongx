import asyncio
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

import httpx
from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ExternalServiceError, NotFoundError
from app.modules.wallet.models import Payment, Wallet, WalletTransaction

TERMINAL_STATUSES = {"paid", "failed", "cancelled", "expired"}


async def _send_email_via_sendgrid(to_email: str, subject: str, html: str) -> None:
    """Send an email via SendGrid or SMTP; log a warning if neither is configured."""
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        def _smtp_send() -> None:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
            msg["To"] = to_email
            msg.attach(MIMEText(html, "html"))
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, _smtp_send)
            logger.info(f"[WALLET-EMAIL] Sent to {to_email}: {subject}")
        except Exception as exc:
            logger.error(f"[WALLET-EMAIL] SMTP error sending to {to_email}: {exc}")
        return

    if settings.TWILIO_SENDGRID_API_KEY:
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail

            sg = sendgrid.SendGridAPIClient(api_key=settings.TWILIO_SENDGRID_API_KEY)
            message = Mail(
                from_email=("noreply@strongx.it.ao", "StrongX"),
                to_emails=to_email,
                subject=subject,
                html_content=html,
            )
            sg.send(message)
            logger.info(f"[WALLET-EMAIL-SG] Sent to {to_email}: {subject}")
        except Exception as exc:
            logger.error(f"[WALLET-EMAIL-SG] SendGrid exception: {exc}")
        return

    logger.warning(
        f"[WALLET-EMAIL-SKIP] No email provider configured. To={to_email} Subject={subject}"
    )


async def _send_reference_email(
    email: str, name: str, entity: str, reference: str, amount: Decimal, expires_at
) -> None:
    """Send an email to the user with their payment reference details."""
    expires_str = (
        expires_at.strftime("%d/%m/%Y %H:%M UTC") if expires_at else "48 horas"
    )
    html = (
        f"<p>Olá {name},</p>"
        f"<p>A sua referência de pagamento foi gerada com sucesso. Utilize os dados abaixo para efectuar o pagamento.</p>"
        f"<table style='border-collapse:collapse;width:100%;max-width:500px;'>"
        f"<tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>Entidade</td>"
        f"<td style='padding:8px;border:1px solid #ddd;'>{entity}</td></tr>"
        f"<tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>Referência</td>"
        f"<td style='padding:8px;border:1px solid #ddd;'>{reference}</td></tr>"
        f"<tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>Montante</td>"
        f"<td style='padding:8px;border:1px solid #ddd;'>{amount} AOA</td></tr>"
        f"<tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>Expira em</td>"
        f"<td style='padding:8px;border:1px solid #ddd;'>{expires_str}</td></tr>"
        f"</table>"
        f"<p><strong>Como pagar:</strong> Pague num ATM Multicaixa ou via Multicaixa Express.</p>"
        f"<p>Após confirmação do pagamento, a sua carteira StrongX será carregada automaticamente.</p>"
        f"<p>— A Equipa StrongX</p>"
    )
    await _send_email_via_sendgrid(
        to_email=email,
        subject="Referência de Pagamento StrongX",
        html=html,
    )


def _strongpay_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.STRONGPAY_API_KEY}",
        "Content-Type": "application/json",
    }


async def get_wallet(db: AsyncSession, user_id: uuid.UUID) -> Wallet:
    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise NotFoundError("Wallet not found")
    return wallet


async def initiate_topup(
    db: AsyncSession,
    user_id: uuid.UUID,
    amount: Decimal,
    method: str,
    phone: str,
    name: str,
    email: Optional[str],
) -> Payment:
    # Map frontend method name to StrongPay method name
    sp_method = "ref" if method == "reference" else "gpo"

    payload: dict = {
        "method": sp_method,
        "amount": float(amount),
        "currency": "AOA",
        "description": "Wallet TopUp",
    }
    if sp_method == "gpo":
        # GPO provider requires digits only — strip leading +
        payload["customer_name"] = name
        payload["customer_phone"] = phone.lstrip("+") if phone else phone
        if email:
            payload["customer_email"] = email

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{settings.STRONGPAY_BASE_URL}/api/v1/payments",
            json=payload,
            headers=_strongpay_headers(),
        )

    if resp.status_code not in (200, 201):
        logger.error(f"StrongPay charge error: {resp.status_code} {resp.text}")
        raise ExternalServiceError(f"Payment provider error: {resp.text}")

    data = resp.json()

    # GPO payments are synchronous — treat as paid immediately if provider confirms success
    gpo_paid = sp_method == "gpo" and (
        data.get("status") == "paid" or data.get("provider_successful") is True
    )
    final_status = "paid" if gpo_paid else data.get("status", "pending")

    txn = WalletTransaction(
        user_id=user_id,
        type="credit",
        amount=amount,
        description=f"Wallet top-up via {method.upper()}",
        status="completed" if gpo_paid else "pending",
    )
    db.add(txn)
    await db.flush()
    await db.refresh(txn)

    payment = Payment(
        user_id=user_id,
        wallet_transaction_id=txn.id,
        merchant_transaction_id=data.get("id", str(uuid.uuid4()))[:15],
        method=method,
        status=final_status,
        amount=amount,
        customer_name=name,
        customer_email=email,
        customer_phone=phone,
        payment_reference=data.get("payment_reference"),
        entity_number=data.get("entity_number"),
        expires_at=_parse_date(data.get("expires_at")),
        provider_id=data.get("id"),
        transaction_id=data.get("transaction_id"),
        provider_successful=data.get("provider_successful"),
        provider_status=data.get("provider_status"),
        provider_code=data.get("provider_code"),
        provider_message=data.get("provider_message"),
        paid_at=datetime.now(timezone.utc) if gpo_paid else None,
    )
    db.add(payment)
    await db.flush()
    await db.refresh(payment)

    # Send reference email if this is a reference payment and we have an email
    if payment.payment_reference and email:
        asyncio.create_task(
            _send_reference_email(
                email=email,
                name=name,
                entity=payment.entity_number or "",
                reference=payment.payment_reference,
                amount=amount,
                expires_at=payment.expires_at,
            )
        )

    if gpo_paid:
        wallet_result = await db.execute(
            select(Wallet).where(Wallet.user_id == user_id).with_for_update()
        )
        wallet = wallet_result.scalar_one_or_none()
        if wallet:
            wallet.balance += amount
        logger.info(f"GPO payment {payment.id} confirmed paid — wallet credited {amount} AOA")

    return payment


def _parse_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


async def list_transactions(
    db: AsyncSession, user_id: uuid.UUID, page: int, page_size: int
) -> tuple[list[tuple[WalletTransaction, Optional[Payment]]], int]:
    count_q = await db.execute(
        select(func.count())
        .select_from(WalletTransaction)
        .where(WalletTransaction.user_id == user_id)
    )
    total = count_q.scalar_one()
    result = await db.execute(
        select(WalletTransaction, Payment)
        .outerjoin(Payment, Payment.wallet_transaction_id == WalletTransaction.id)
        .where(WalletTransaction.user_id == user_id)
        .order_by(WalletTransaction.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.all()), total


async def sync_pending_payments(db: AsyncSession, user_id: Optional[uuid.UUID] = None) -> int:
    """Poll StrongPay for all pending payments and apply status updates. Returns count synced."""
    q = select(Payment).where(Payment.status == "pending")
    if user_id:
        q = q.where(Payment.user_id == user_id)
    result = await db.execute(q)
    pending = list(result.scalars().all())
    if not pending:
        return 0

    synced = 0

    async with httpx.AsyncClient(timeout=30) as client:
        for payment in pending:
            if not payment.provider_id:
                continue

            resp = await client.get(
                f"{settings.STRONGPAY_BASE_URL}/api/v1/payments/{payment.provider_id}",
                headers=_strongpay_headers(),
            )
            if resp.status_code != 200:
                logger.warning(f"StrongPay poll {payment.provider_id}: {resp.status_code}")
                continue

            data = resp.json()
            new_status = data.get("status", "pending").lower()

            # Normalise any provider-specific aliases
            _alias = {"success": "paid", "canceled": "cancelled"}
            new_status = _alias.get(new_status, new_status)

            if new_status == payment.status:
                continue

            payment.status = new_status
            payment.provider_successful = (new_status == "paid")
            payment.provider_status = new_status

            if new_status == "paid":
                payment.paid_at = datetime.now(timezone.utc)
                await _credit_wallet(db, payment)

            elif new_status in TERMINAL_STATUSES:
                await _mark_transaction(db, payment, new_status)

            synced += 1
            logger.info(f"StrongPay poll: payment {payment.id} → {new_status}")

    await db.flush()
    return synced


async def _credit_wallet(db: AsyncSession, payment: Payment) -> None:
    wallet_result = await db.execute(
        select(Wallet).where(Wallet.user_id == payment.user_id).with_for_update()
    )
    wallet = wallet_result.scalar_one_or_none()
    if wallet:
        wallet.balance += payment.amount

    await _mark_transaction(db, payment, "completed")


async def _mark_transaction(db: AsyncSession, payment: Payment, status: str) -> None:
    if not payment.wallet_transaction_id:
        return
    txn_result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.id == payment.wallet_transaction_id)
        .with_for_update()
    )
    txn = txn_result.scalar_one_or_none()
    if txn:
        txn.status = status


async def list_payments(
    db: AsyncSession, user_id: uuid.UUID, page: int, page_size: int
) -> tuple[list[Payment], int]:
    base = select(Payment).where(Payment.user_id == user_id)
    count = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count.scalar_one()
    result = await db.execute(
        base.order_by(Payment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all()), total
