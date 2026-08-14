set shell := ["bash", "-euo", "pipefail", "-c"]
export ASTRO_TELEMETRY_DISABLED := "1"
set dotenv-load := true
set dotenv-filename := ".env.local"
set dotenv-override := true

# Default recipe shows help
default:
    @just --list

# Add the project dependencies to a new workspace
bootstrap:
    @bun add astro @astrojs/cloudflare
    @bun add --dev sst typescript @astrojs/check vitest @vitest/coverage-v8 happy-dom @playwright/test eslint @eslint/js typescript-eslint eslint-plugin-astro prettier prettier-plugin-astro

# Install the exact dependencies from the lockfile
install:
    @bun install --frozen-lockfile

# Sync installed dependencies with package.json
sync:
    @bun install

# Install SST providers and generated support files
sst-install:
    @bun x sst install

# Start the Astro development server with hot reload
dev host="127.0.0.1":
    @ASTRO_DEV_BACKGROUND=0 bun x astro dev --host {{host}}

# Format all supported project files
format:
    @bun x prettier --write .

# Format only the supplied file paths
format-files *paths:
    @bun x prettier --write {{paths}}

# Check formatting without changing files
format-check:
    @bun x prettier --check .

# Check source files with ESLint
lint:
    @bun x eslint .

# Check Astro and TypeScript types
typecheck:
    @bun x astro check

# Run unit tests once
test:
    @bun x vitest run

# Run unit tests and report coverage
coverage:
    @bun x vitest run --coverage

# Run Playwright tests with the configured browser
test-browser:
    @bun x playwright test

# Install Playwright's managed Chromium browser
install-browser:
    @bun x playwright install chromium

# Install Chromium and its system packages for CI
install-browser-ci:
    @bun x playwright install --with-deps chromium

# Run every local quality gate
check: format-check lint typecheck test coverage

# Build the production Cloudflare application
build:
    @bun x astro build

# Serve the production build locally
preview host="127.0.0.1":
    @bun x astro preview --host {{host}}

# Validate one deployment stage's environment
validate-env stage="development":
    @bun run scripts/validate-environment.ts {{stage}}

# Validate and deploy one SST stage
deploy stage="production":
    @bun run scripts/validate-environment.ts {{stage}}
    @bun x sst deploy --stage {{stage}}
