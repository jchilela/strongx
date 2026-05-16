from typing import Any

import socketio
from loguru import logger

from app.core.config import settings

# NOTE: For real-time events from ARQ workers to reach connected clients, configure a
# Socket.IO Redis message queue adapter:
#   client_manager = socketio.AsyncRedisManager(settings.REDIS_URL)
#   sio = socketio.AsyncServer(..., client_manager=client_manager)
# Without it, events emitted from worker processes (different OS processes) won't
# reach Socket.IO clients connected to the API server process.
# For single-process deployments (uvicorn single worker), the in-process sio works fine.

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.FRONTEND_URL if settings.APP_ENV == "production" else "*",
    logger=False,
    engineio_logger=False,
)


@sio.event
async def connect(sid: str, environ: dict, auth: dict | None = None) -> bool:
    """Authenticate on connect via JWT in auth.token."""
    from app.core.security import decode_token

    if auth is None or "token" not in auth:
        logger.warning(f"Socket.IO: unauthenticated connect attempt sid={sid}")
        return False

    try:
        payload = decode_token(auth["token"])
        if payload.get("type") != "access":
            return False
        user_id = payload["sub"]
        room = f"user_{user_id}"
        await sio.save_session(sid, {"user_id": user_id, "room": room})
        await sio.enter_room(sid, room)
        logger.info(f"Socket.IO: {sid} connected → joined room {room}")
        return True
    except Exception as exc:
        logger.warning(f"Socket.IO: connect rejected sid={sid} reason={exc}")
        return False


@sio.event
async def disconnect(sid: str) -> None:
    session = await sio.get_session(sid)
    if session:
        room = session.get("room")
        logger.info(f"Socket.IO: {sid} disconnected, left room {room}")


async def emit_to_user(user_id: str, event: str, data: Any) -> None:
    room = f"user_{user_id}"
    try:
        await sio.emit(event, data, room=room)
    except Exception as exc:
        logger.debug(f"Socket.IO emit failed (event={event}, room={room}): {exc}")
