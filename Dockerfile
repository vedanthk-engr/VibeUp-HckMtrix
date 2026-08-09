FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (needed for compiling some python packages if binary wheels aren't used)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend codebase
COPY backend/ /app/backend/

# Set environment variables
ENV PORT=8000
EXPOSE 8000

# Run FastAPI app through uvicorn
CMD ["sh", "-c", "python -m uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
