# hoajs

A Claude Code plugin for the Hoa web framework and the official `@hoajs/*` package ecosystem.

It provides the `hoajs` skill for explaining hoajs concepts, writing and reviewing hoajs code, building Cloudflare Workers examples, classifying package dependencies, and migrating Hono/Koa/Express-style code to hoajs conventions.

## Included skill

- `hoajs`

## Use this plugin for

- Understanding hoajs architecture, middleware execution, routing, `ctx`, `ctx.req`, and `ctx.res`.
- Building or reviewing hoajs apps, middleware, validators, security packages, and README/test updates.
- Writing Cloudflare Workers examples with `hoa`, `@hoajs/tiny-router`, KV, R2, D1, Durable Objects, Cron, and related bindings.
- Classifying dependencies in hoajs packages as runtime, peer, dev/build-tool, test-only, docs-only, example-only, transitive, or unclear.
- Migrating Hono, Koa, or Express-style examples to hoajs without inventing non-existent APIs.

## Bundled helper scripts

The skill includes lightweight Node.js helper scripts under `skills/hoajs/scripts/`:

- `check-hono-api-misuse.js` — flags common Hono/Express API usage in hoajs source files.
- `check-no-private-leak.js` — scans public artifacts for obvious private data such as tokens, real IDs, local paths, and internal details.
- `classify-dependencies.js` — produces a draft dependency classification table for hoajs package repositories.

These scripts are heuristic preflight helpers. They do not replace source review, full secret scanning, or maintainer judgment.

## Privacy and safety

Public examples should use placeholders for Cloudflare IDs, domains, database URLs, tokens, JWTs, cookies, logs, and request/response samples. Do not include private project data in generated public docs or release artifacts.

## License

MIT
