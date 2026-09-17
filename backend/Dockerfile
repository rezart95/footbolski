FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN pip install --no-cache-dir uv
# uv.lock must be copied alongside pyproject.toml: `uv sync` only pins
# transitive dependencies if the lockfile is present at this point. The later
# `COPY . .` brings it in too late to affect the install.
COPY pyproject.toml uv.lock ./
# --frozen: install exactly what the lockfile pins and fail if it disagrees
# with pyproject.toml, rather than silently re-resolving at build time and
# shipping versions that were never tested locally.
RUN uv sync --no-dev --frozen
ENV PATH="/app/.venv/bin:$PATH"

COPY . .

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
