---
name: hoajs
description: Use this skill first for any coding, testing, README, dependency, or example work involving `hoajs`, `@hoajs/*`, or the Hoa web framework. Trigger even when the request is in Chinese or another domain is mentioned, including hoajs with Cloudflare Workers/KV/R2/D1, Node.js adapters, middleware/中间件, routers/routes, `app.fetch`, `ctx`, `hoa` with `@hoajs/tiny-router`, `@hoajs/bodyparser`, `@hoajs/zod`, and hoajs repo/package conventions. Prefer this over generic Cloudflare, Node, npm, Express, Koa, or Hono guidance whenever the user needs hoajs APIs or ecosystem rules. Do not use for unrelated "hoa" abbreviations, ordinary Hono/Express/Koa projects, generic dependency advice with no hoajs package, or docs that only mention Hoa without implementing or analyzing hoajs.
---

# hoajs

Use this skill for hoajs framework and official `@hoajs/*` ecosystem work: code generation, code modification, middleware development, Cloudflare Workers examples, dependency classification, README/test updates, and migration from Hono/Koa/Express style code to hoajs.

## First decide the task type

Classify the user request before acting:

- Architecture or package explanation → read `references/overview.md`, `references/repo-map.md`, `references/architecture.md`.
- Latest official docs, exact package options, or possible reference drift → use the official docs workflow below, then read the relevant bundled reference.
- `Hoa`, `ctx`, `ctx.req`, `ctx.res`, errors, body/headers/status → read `references/api.md` and `references/architecture.md`.
- Routes, params, `app.get`, `app.post`, router choice → read `references/routing.md`.
- Middleware creation/modification → read `references/middleware.md`, `references/dependencies.md`, `references/testing.md`, `references/code-style.md`.
- Dependency analysis → read `references/dependencies.md`.
- Validation → read `references/validation.md`.
- Auth/security → read `references/security.md`.
- Cloudflare Workers/KV/R2/D1/Durable Objects/Cron/Email → read `references/cloudflare.md` and `references/examples.md`.
- Concrete snippets, starting templates, migration examples, or step-by-step implementation patterns → read `references/recipes.md`.
- Hono/Koa/Express migration → read `references/anti-patterns.md` and `references/recipes.md`; for Koa, preserve the middleware shape but remap Koa `ctx.body`/`ctx.status`/`ctx.request` APIs to hoajs `ctx.res`/`ctx.req` APIs.
- README, tests, package/build/lint style → read `references/code-style.md` and `references/testing.md`.

Read only the references needed for the task. For code changes, also inspect the target repository files; references are guidance, not a substitute for local source. If generating, modifying, or migrating code, read `references/anti-patterns.md` before finalizing.

## Official docs freshness workflow

Bundled references are the default starting point because they are compressed for common hoajs tasks. When the user asks for the latest docs, exact package options, or behavior that may have changed, consult official hoajs docs as a freshness check before giving concrete API details:

1. Fetch official docs directly from the project’s canonical website when web access is available, e.g. `https://hoa-js.com/llms.txt` and `https://hoa-js.com/llms-full.txt`.
2. Use `llms.txt` to find the relevant page path, then fetch only the matching section from `llms-full.txt` or the corresponding official docs page.
3. Do not assume users have local website/docs repository files such as `llms.txt` or `llms-full.txt`; those are maintainer development inputs, not packaged-skill dependencies.
4. Do not broad-search the web for hoajs API facts unless the canonical docs URL is unknown or unavailable.
5. Treat official docs as stronger than bundled summaries for exact option names and examples, but still verify package code when editing a repository.

## Code-change workflow

When modifying a hoajs package or app:

1. Identify the target package/app and task type.
2. Read the target `package.json`.
3. Read relevant `src/` files before editing.
4. Read relevant tests and README/docs if behavior or public API changes.
5. Determine whether the target export is middleware (`app.use(...)`) or an app extension (`app.extend(...)`).
6. Classify any added/changed dependencies as runtime, peer, dev, test-only, example-only, transitive, or unclear.
7. Make the smallest style-matching change.
8. Update tests and README when public behavior changes.
9. Run relevant lint/test/type-check commands when available.

When the user asks for tests or test strategy, prefer `app.fetch(new Request(...))` examples for hoajs behavior tests. Use curl only as an additional manual smoke test, not as the primary package test example.

## Core hoajs facts to preserve

- Core `hoa` does not provide routes by itself. `app.get/post/...` come from `@hoajs/router` or `@hoajs/tiny-router` after `app.extend(router())` or `app.extend(tinyRouter())`.
- hoajs handlers use `(ctx, next)`, not Express `(req, res)` and not Hono `c`.
- Set responses with `ctx.res.status`, `ctx.res.type`, `ctx.res.set(...)`, and `ctx.res.body`.
- Read request data from `ctx.req`, e.g. `ctx.req.query`, `ctx.req.params`, `ctx.req.get(...)`, `ctx.req.body`, `ctx.req.json()`.
- Use `ctx.throw(status, message, options)` or `HttpError` for HTTP errors.
- Cloudflare Workers bindings are available via `ctx.env`; in hoajs request handlers, `ctx.executionCtx` is the per-request execution context passed into `app.fetch(request, env, executionCtx)`. In Worker `scheduled(event, env, executionCtx)` handlers, the third argument is Cloudflare's event `ExecutionContext`, not hoajs request `ctx`.

## Dependency classification workflow

For dependency questions or package changes:

1. Check `dependencies`, `peerDependencies`, `optionalDependencies`, and `devDependencies`.
2. Search `src/` imports for runtime use.
3. Search tests for test-only use.
4. Search examples and README/docs for example-only use.
5. Mark unclear items as “needs maintainer confirmation”; do not delete or move them without confirmation.
6. Do not recommend test-only or docs-only dependencies as production install requirements.

## Cloudflare workflow

For Cloudflare Workers + hoajs tasks:

- Default to `hoa` + `@hoajs/tiny-router` for lightweight examples.
- Add `@hoajs/bodyparser` and `@hoajs/json` for JSON POST APIs.
- Add `app.extend(cookie())` for cookie helpers.
- Use `export default app` for simple fetch-only Workers.
- Use `export default { fetch: app.fetch, scheduled(...) { ... } }` when Cron is needed; name the scheduled handler third parameter `executionCtx` when possible to avoid confusing it with hoajs request `ctx`.
- For Durable Objects/WebSocket, dispatch special paths in `fetch`, then fall back to `app.fetch(request, env, executionCtx)` when the custom Worker handler also names its third argument `executionCtx`.
- Use placeholders in all Wrangler examples.

## Avoid these mistakes

For full anti-patterns and corrected examples, read `references/anti-patterns.md`.

- Do not invent hoajs APIs.
- Do not use Hono APIs like `c.json()`, `c.text()`, `c.req`, `new Hono()`, unless explicitly migrating from Hono and clearly labeling source vs target.
- Do not use Express `req` / `res` handlers.
- Do not assume `app.get` exists before `app.extend(router())` or `app.extend(tinyRouter())`.
- Do not write real Cloudflare account IDs, route domains, KV/R2/D1/Durable Object IDs, database URLs, tokens, JWTs, cookies, logs, or request/response samples into public output.
- Do not include private/internal project names, paths, business modules, source snippets, API names, fields, logs, domains, or any identifiable private information.

## Optional validation scripts

Use bundled scripts for deterministic preflight checks when they fit the task. These scripts are heuristic and intentionally lightweight; they do not replace source review, secret scanning, or maintainer judgment. Use their output as evidence, then fix issues or report uncertainty.

| Script | When to run | Command | How to use result |
|---|---|---|---|
| `scripts/check-hono-api-misuse.js` | After generating, modifying, or migrating target hoajs source code | `node <skill-path>/scripts/check-hono-api-misuse.js <target-path>` | If it reports common Hono/Express API misuse in target hoajs source files, fix before finalizing. Manually review README/Markdown examples and ignore source snippets only when clearly labeled as pre-migration input. |
| `scripts/check-no-private-leak.js` | Before publishing docs, examples, evals, or the packaged skill | `node <skill-path>/scripts/check-no-private-leak.js <target-path> [...]` | Redact real IDs, domains, tokens, local paths, logs, request/response samples, and private project details before public output. Treat this as an obvious-leak scanner, not a complete secret scanner; generic IPv4 or local-network teaching examples may still need manual false-positive review. |
| `scripts/classify-dependencies.js` | When analyzing a hoajs package dependency list | `node <skill-path>/scripts/classify-dependencies.js <package-path>` | Treat the table as a draft classification. Its `Classification` column follows `references/dependencies.md`; use the `Notes` column for optional/undeclared nuance, then verify against source/tests/docs/package scripts and maintainer intent. |

Run these scripts when the check is relevant, not for every hoajs question. If a script cannot run in the current environment, explain that and perform the equivalent manual review.

## Public output and privacy rules

All public examples must be generic and use placeholders:

```jsonc
{
  "account_id": "<cloudflare-account-id>",
  "name": "<worker-name>",
  "kv_namespaces": [{ "binding": "KV", "id": "<kv-namespace-id>" }],
  "r2_buckets": [{ "binding": "R2", "bucket_name": "<bucket-name>" }]
}
```

If a user provides private values while asking for public docs or a publishable skill, replace them with placeholders and mention that they were intentionally redacted.
