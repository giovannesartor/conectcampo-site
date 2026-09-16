#!/bin/sh
set -eu

REPOSITORY_PATH="${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$(dirname "$0")/../../../.." && pwd)}"

echo "Preparing ConectCampo iOS dependencies for Xcode Cloud"
cd "$REPOSITORY_PATH/mobile"

if ! command -v node >/dev/null 2>&1; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew is required to install Node.js in Xcode Cloud" >&2
    exit 1
  fi

  echo "Installing Node.js 22 in the Xcode Cloud environment"
  brew install node@22
  export PATH="$(brew --prefix node@22)/bin:$PATH"
fi

node --version
npm --version
npm ci --no-audit --no-fund
npx cap sync ios

echo "ConectCampo iOS dependencies ready"
