# Develop Fontpond

This guide is for developers with Bun 1.3 or newer and `just` installed. It starts Fontpond with hot reload.

## Install

Run from the project root:

```sh
just install
```

The command installs versions locked in `bun.lock`.

## Start hot reload

```sh
just dev
```

Open `http://127.0.0.1:4321`. Fontpond should show heading, body, and layout selectors beside the preview.

## Demo 1

1. Choose a heading font. The preview heading should change without a page reload.
2. Choose a body font. Preview paragraphs and labels should change without a page reload.
3. Switch between Landing Hero, Blog Article, Dashboard Card, and Pricing Card. Only the chosen layout should remain visible.
4. Try a Google font and a system font. The pairing name above the preview should match both choices.

The checkpoint succeeds when all four layouts respond immediately and the browser console stays clear.

## Demo 2

1. Under **Try a local font**, choose a WOFF, WOFF2, TTF, or OTF file no larger than 5 MB. For a repository fixture, use `tests/fixtures/fonts/ApfelGrotezk-Regular.woff2`.
2. Upload a second font. Confirm both families remain in both font selectors, the newest upload becomes the heading font, and both carry the **Uploaded this session** source label when selected.
3. Confirm the pairing score changes and explains readability, hierarchy, contrast, fallback behavior, and pairing quality.
4. Select an earlier uploaded family for body text, select the same family for both roles, or use Bebas Neue for body text. Confirm the selected uploads render together and the score panel shows the relevant review note or warning.
5. Try `tests/fixtures/fonts/ApfelGrotezk-LICENSE.txt`. Fontpond should reject it inline and keep the current pair.
6. Reload the tab. Every uploaded family should be gone because local fonts are never persisted or sent to a server.

The checkpoint succeeds when the upload, score, warnings, invalid-file recovery, and reload cleanup all behave as described.

## Verify

```sh
just check
just build
just test-browser
```

`just check` verifies formatting, lint rules, types, unit tests, and the 80% coverage floor. `just build` creates the Cloudflare server bundle. `just test-browser` starts the app and checks the visible Demo 1 and Demo 2 flows with the configured browser. Without an override, it uses Playwright Chromium.

Local commands need no environment file. `just validate-env production` checks the two Cloudflare variables documented in `.env.example` before deployment.

## Run browser tests with Brave

Set the absolute Brave path for the command:

```sh
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/brave-browser-stable just test-browser
```

Playwright launches Brave for this test run. The setting does not affect later commands.

## Run browser tests with Playwright Chromium

Leave `PLAYWRIGHT_EXECUTABLE_PATH` unset. Install the managed browser, then run the same test recipe:

```sh
just install-browser
just test-browser
```

In CI, install Chromium with its Linux packages before running the test:

```sh
just install-browser-ci
just test-browser
```
