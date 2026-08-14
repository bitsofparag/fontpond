set shell := ["bash", "-euo", "pipefail", "-c"]
export ASTRO_TELEMETRY_DISABLED := "1"

bootstrap:
    @bun add astro @astrojs/cloudflare
    @bun add --dev sst typescript @astrojs/check vitest @vitest/coverage-v8 happy-dom @playwright/test eslint @eslint/js typescript-eslint eslint-plugin-astro prettier prettier-plugin-astro

install:
    @bun install --frozen-lockfile

sync:
    @bun install

sst-install:
    @bun x sst install

dev host="127.0.0.1":
    @bun x astro dev --host {{host}}

format:
    @bun x prettier --write .

format-check:
    @bun x prettier --check .

lint:
    @bun x eslint .

typecheck:
    @bun x astro check

test:
    @bun x vitest run

coverage:
    @bun x vitest run --coverage

test-browser:
    @bun x playwright test

install-browser:
    @bun x playwright install chromium

install-browser-ci:
    @bun x playwright install --with-deps chromium

check: format-check lint typecheck test coverage

build:
    @bun x astro build

preview host="127.0.0.1":
    @bun x astro preview --host {{host}}

validate-env stage="development":
    @bun run scripts/validate-environment.ts {{stage}}

deploy stage="production":
    @bun run scripts/validate-environment.ts {{stage}}
    @bun x sst deploy --stage {{stage}}
