#!/bin/sh
set -eu

REPOSITORY_PATH="${CI_PRIMARY_REPOSITORY_PATH:-$(pwd)}"

echo "Preparing ConectCampo iOS dependencies for Xcode Cloud"
cd "$REPOSITORY_PATH/mobile"

node --version
npm --version
npm ci --no-audit --no-fund
npx cap sync ios

echo "ConectCampo iOS dependencies ready"
