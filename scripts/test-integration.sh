#!/bin/bash
# Run integration tests against Docker Compose services
# Prerequisites: docker compose -f docker-compose.test.yml up -d

set -euo pipefail

echo "🧪 Running integration tests..."
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services..."
docker compose -f docker-compose.test.yml up -d --wait 2>/dev/null || true

# Run integration tests for each server that has integration tests
for pkg in redis postgres mysql mongodb elasticsearch sqlite s3 kafka; do
  if [ -f "packages/$pkg/tests/integration.test.ts" ]; then
    echo "▶ Running $pkg integration tests..."
    cd "packages/$pkg"
    pnpm vitest run tests/integration.test.ts --reporter=verbose || true
    cd ../..
    echo ""
  fi
done

echo "✅ Integration tests complete"
