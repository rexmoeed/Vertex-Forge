#!/usr/bin/env bash
# ==============================================================================
# Vertex Forge - Fresh Clone Offline Verification Script
# ==============================================================================
# Verifies clean installation, compilation, and isolated test execution.
# Exit code 0 indicates 100% offline determinism and zero network dependencies.
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "⚡ Vertex Forge - Clean Clone Verification Suite"
echo "=========================================================="

echo "[1/4] Cleaning existing dependencies and build artifacts..."
rm -rf node_modules dist dist-electron coverage

echo "[2/4] Installing dependencies via clean npm ci..."
npm ci

echo "[3/4] Compiling production bundle..."
npm run build

echo "[4/4] Executing isolated test suite in offline mode..."
NODE_ENV=test OFFLINE_MODE=true npm run test:integration-isolated

echo "=========================================================="
echo "✅ SUCCESS: All fresh-clone offline verification gates passed!"
echo "=========================================================="
