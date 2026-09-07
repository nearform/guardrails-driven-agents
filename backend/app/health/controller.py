from typing import Literal

from litestar import get
from pydantic import BaseModel


class HealthStatus(BaseModel):
    status: Literal["ok"]


@get("/health")
async def health_check() -> HealthStatus:
    return HealthStatus(status="ok")
