# Deploy Fontpond

This guide is for the Fontpond maintainer. It deploys `main` to Cloudflare Workers at `https://fontpond.com` through GitHub Actions.

## Prepare Cloudflare

The `fontpond.com` zone must be active in the same Cloudflare account used for deployment. Remove any existing CNAME record for `fontpond.com`; Cloudflare Workers cannot attach a custom domain over that record.

Create an account API token from the **Edit Cloudflare Workers** template. Add these permissions required by SST’s Cloudflare state and DNS setup:

- Account — D1 — Edit
- Zone — DNS — Edit

Limit the token to the target Cloudflare account and the `fontpond.com` zone.

## Add GitHub secrets

Create a GitHub environment named `production` in `bitsofparag/fontpond`. Add two environment secrets:

| Secret                          | Value                        |
| ------------------------------- | ---------------------------- |
| `CLOUDFLARE_API_TOKEN`          | Cloudflare account API token |
| `CLOUDFLARE_DEFAULT_ACCOUNT_ID` | Cloudflare account ID        |

The workflow never exposes these secrets to pull request checks.

## Deploy

Push the reviewed change to `main`, or run the **Deploy** workflow on `main`. The workflow runs checks, builds the Cloudflare bundle, runs Chromium browser tests, and serializes production deployments before running:

```sh
just deploy production
just smoke-production
```

SST creates the Worker, DNS record, and certificate for `fontpond.com`. A successful smoke test receives a valid HTTPS response from `https://fontpond.com`.

## Deploy from a local machine

Copy `.env.example` to the ignored `.env.local` file. Replace both placeholders, then run:

```sh
just plan production
just deploy production
just smoke-production
```

`just plan production` shows the proposed Cloudflare changes without applying them. Do not commit `.env.local`. Non-production SST stages use generated Worker URLs and never claim `fontpond.com`.

## Recover

Use the Cloudflare Workers dashboard to roll back to an earlier Worker version. Do not run `sst remove --stage production`; production resources use SST’s `retain` removal policy.
