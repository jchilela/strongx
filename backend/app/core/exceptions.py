from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class StrongXException(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        code: str = "error",
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(message)


class NotFoundError(StrongXException):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status.HTTP_404_NOT_FOUND, "not_found")


class UnauthorizedError(StrongXException):
    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, "unauthorized")


class ForbiddenError(StrongXException):
    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(message, status.HTTP_403_FORBIDDEN, "forbidden")


class ConflictError(StrongXException):
    def __init__(self, message: str = "Conflict") -> None:
        super().__init__(message, status.HTTP_409_CONFLICT, "conflict")


class InsufficientFundsError(StrongXException):
    def __init__(self, message: str = "Insufficient wallet balance") -> None:
        super().__init__(message, status.HTTP_402_PAYMENT_REQUIRED, "insufficient_funds")


class RateLimitError(StrongXException):
    def __init__(self, message: str = "Rate limit exceeded") -> None:
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, "rate_limited")


class ValidationError(StrongXException):
    def __init__(self, message: str = "Validation error") -> None:
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, "validation_error")


class ExternalServiceError(StrongXException):
    def __init__(self, message: str = "External service error") -> None:
        super().__init__(message, status.HTTP_502_BAD_GATEWAY, "external_service_error")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StrongXException)
    async def strongx_exception_handler(
        request: Request, exc: StrongXException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.code, "message": exc.message},
        )
