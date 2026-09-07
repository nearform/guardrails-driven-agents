FROM ghcr.io/astral-sh/uv:python3.14-bookworm-slim

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv

WORKDIR /app

# Cached dependency layer: only manifest + lockfile, no dev deps, no project yet
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Application source
COPY . .
RUN uv sync --frozen --no-dev

EXPOSE 8000

# Production run: no autoreload, bind all interfaces
CMD ["uv", "run", "litestar", "--app", "app.main:app", "run", "--host", "0.0.0.0", "--port", "8000"]
