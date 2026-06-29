# hoajs Anti-patterns

Read this before finalizing generated, modified, or migrated hoajs code. This file is the authoritative anti-pattern list for the skill. Topic references keep short local reminders, but this file contains the full wrong/correct examples.

## 1. Hono API contamination

hoajs is similar to Hono in spirit, but it does not use Hono's `c` context API.

Wrong:

```js
app.get('/', c => c.json({ ok: true }))
```

Correct:

```js
app.get('/', async (ctx) => {
  ctx.res.body = { ok: true }
})
```

Wrong:

```js
app.get('/hello', c => c.text('Hello'))
```

Correct:

```js
app.get('/hello', async (ctx) => {
  ctx.res.body = 'Hello'
})
```

Wrong:

```js
import { Hono } from 'hono'

const app = new Hono()
```

Correct:

```js
import { Hoa } from 'hoa'

const app = new Hoa()
```

## 2. Express handler style

hoajs does not use Express `req` / `res` handlers.

Wrong:

```js
app.use((req, res) => {
  res.json({ ok: true })
})
```

Correct:

```js
app.use(async (ctx) => {
  ctx.res.body = { ok: true }
})
```

Wrong:

```js
app.get('/users/:id', (req, res) => {
  res.send(req.params.id)
})
```

Correct:

```js
app.get('/users/:id', async (ctx) => {
  ctx.res.body = ctx.req.params.id
})
```

## 3. Koa context API copy-paste

Koa middleware also uses `(ctx, next)`, but the context object is not the same as hoajs. Preserve the middleware flow, not the Koa property names.

Wrong:

```js
app.use(async (ctx, next) => {
  ctx.status = 201
  ctx.body = { ok: true }
  ctx.set('x-powered-by', 'koa')
  await next()
})
```

Correct:

```js
app.use(async (ctx, next) => {
  ctx.res.status = 201
  ctx.res.body = { ok: true }
  ctx.res.set('x-powered-by', 'hoajs')
  await next()
})
```

Common mappings:

| Koa habit | hoajs pattern |
|---|---|
| `ctx.body = value` | `ctx.res.body = value` |
| `ctx.status = code` | `ctx.res.status = code` |
| `ctx.set(name, value)` | `ctx.res.set(name, value)` |
| `ctx.request.body` | `ctx.req.body` after `@hoajs/bodyparser`, or `await ctx.req.json()` |
| `ctx.query` | `ctx.req.query` |
| `ctx.params` from koa-router | `ctx.req.params` after `app.extend(router())` or `app.extend(tinyRouter())` |
| Koa router helpers | hoajs route helpers only after a router extension |

`ctx.throw(status, message)` is conceptually similar, but still verify hoajs error behavior and any `options`/headers expected by the target package.

## 4. Assuming core `hoa` has routes

Core `hoa` does not define `app.get()` or `app.post()`. Route helpers come from `@hoajs/router` or `@hoajs/tiny-router`.

Wrong:

```js
import { Hoa } from 'hoa'

const app = new Hoa()
app.get('/todos', async (ctx) => {
  ctx.res.body = []
})
```

Correct:

```js
import { Hoa } from 'hoa'
import { tinyRouter } from '@hoajs/tiny-router'

const app = new Hoa()
app.extend(tinyRouter())

app.get('/todos', async (ctx) => {
  ctx.res.body = []
})
```

## 5. Confusing middleware with app extensions

Some packages return request middleware for `app.use(...)`; others return app extensions for `app.extend(...)`.

Wrong:

```js
app.use(tinyRouter())
app.use(cookie())
app.use(nodeServer())
```

Correct:

```js
app.extend(tinyRouter())
app.extend(cookie())
app.extend(nodeServer())
```

Correct middleware usage:

```js
app.use(bodyParser())
app.use(json())
app.use(cors())
```

When unsure, inspect the package source or relevant reference before generating code.

## 6. Reading request body twice

Web `Request` body streams are generally single-use.

Wrong:

```js
const text = await ctx.req.text()
const data = await ctx.req.json()
```

Correct, parse once:

```js
const data = await ctx.req.json()
```

Correct, use bodyparser for shared body access:

```js
app.use(bodyParser())

app.post('/items', async (ctx) => {
  ctx.res.body = ctx.req.body
})
```

## 7. Returning raw objects without understanding response wrapping

hoajs allows `ctx.res.body = object`; `ctx.response` serializes it as JSON. `@hoajs/json` additionally wraps responses in an envelope.

Potentially wrong if the user expects an envelope:

```js
ctx.res.body = { title: 'Todo' }
```

Correct with `@hoajs/json` when an envelope is desired:

```js
app.use(json())

app.post('/todos', async (ctx) => {
  ctx.res.body = { title: ctx.req.body.title }
})
```

Result body is shaped by `@hoajs/json`, usually `{ code, data }`.

## 8. Treating test dependencies as production dependencies

Some packages use router packages only in tests.

Wrong:

```md
Install @hoajs/cache with @hoajs/router because @hoajs/router appears in devDependencies.
```

Correct:

```md
@hoajs/router is test-only unless `src/` imports it or the package requires routing at runtime.
```

Always classify dependencies using `dependencies.md`.

## 9. Treating peer dependencies as bundled dependencies

Validator adapters and host framework deps are often peer dependencies.

Wrong:

```md
@hoajs/zod bundles zod for you.
```

Correct:

```md
Install both packages in the consuming app:

npm i @hoajs/zod zod
```

`zod` is a peer dependency; the user app provides it.

## 10. Deleting unclear dependencies too aggressively

Wrong:

```md
This dependency was not found in src, so remove it.
```

Correct:

```md
This dependency was not found in src. It may be test-only, docs-only, build-related, or stale. Mark it as unclear and ask the maintainer before removing it.
```

## 11. Leaking real Cloudflare configuration

Wrong:

```jsonc
{
  "account_id": "real-account-id-from-dashboard",
  "routes": [{ "pattern": "real-service-domain.example/*" }],
  "kv_namespaces": [{ "binding": "KV", "id": "real-kv-namespace-id-from-dashboard" }]
}
```

Correct:

```jsonc
{
  "account_id": "<cloudflare-account-id>",
  "routes": [{ "pattern": "<domain>/*", "zone_name": "<zone-name>" }],
  "kv_namespaces": [{ "binding": "KV", "id": "<kv-namespace-id>" }]
}
```

## 12. Putting secrets in `vars`

Wrong:

```jsonc
{
  "vars": {
    "API_TOKEN": "<real-secret-token-would-be-wrong-here>"
  }
}
```

Correct:

```bash
wrangler secret put API_TOKEN
```

Use `vars` for non-sensitive config only.

## 13. Using Node-only APIs in Workers without checking compatibility

Wrong:

```js
import fs from 'node:fs'
```

Correct:

```js
// Prefer Web APIs in Cloudflare Workers examples.
// If Node compatibility is required, explicitly document the compatibility flag and runtime limits.
```

Special caution: `@hoajs/context-storage` uses `node:async_hooks`; verify runtime compatibility before recommending it in Workers.

## 14. Forgetting `app.fetch` fallback in custom Workers

When dispatching WebSocket or Durable Object paths, do not forget normal app routes.

Wrong:

```js
export default {
  async fetch (request, env, executionCtx) {
    if (isWebSocket(request)) return stub.fetch(request)
  }
}
```

Correct:

```js
export default {
  async fetch (request, env, executionCtx) {
    if (isWebSocket(request)) return stub.fetch(request)
    return app.fetch(request, env, executionCtx)
  }
}
```

## 15. Writing public examples from private projects

Wrong:

```md
Use a real internal route, schema, module name, domain, token, log, or request body as an example.
```

Correct:

```md
Use generic placeholders and public hoajs examples only.
```

Never include private project names, paths, business modules, API names, fields, logs, real domains, Cloudflare IDs, JWTs, cookies, database URLs, or request/response data.

## 16. Overfitting official examples into production architecture

Official examples are valuable minimal patterns, but many are intentionally small and single-file.

Wrong:

```md
All production hoajs Workers should be single-file apps because examples are single-file.
```

Correct:

```md
Use examples for minimal patterns. For larger apps, recommend generic layering such as entry, routes, services, data access, and utilities without copying private project structure.
```

## Final checklist

Before finalizing hoajs code, check:

- No Hono `c.*` APIs.
- No Express `req/res` handler style.
- Routes are installed through `app.extend(router())` or `app.extend(tinyRouter())`.
- Middleware vs extension registration is correct.
- Dependencies are correctly classified.
- Cloudflare examples use placeholders.
- No private/internal project information is present.
