# hoajs on Cloudflare Workers

Read this for Cloudflare Workers, KV, R2, D1, Durable Objects, Cron triggers, Email Workers, `wrangler` config, and edge runtime constraints.

## Minimal Worker

```js
import { Hoa } from 'hoa'
import { tinyRouter } from '@hoajs/tiny-router'

const app = new Hoa()
app.extend(tinyRouter())

app.get('/', async (ctx) => {
  ctx.res.body = 'Hello, Hoa!'
})

export default app
```

## JSON API Worker

```js
import { Hoa } from 'hoa'
import { tinyRouter } from '@hoajs/tiny-router'
import { bodyParser } from '@hoajs/bodyparser'
import { json } from '@hoajs/json'

const app = new Hoa()
app.extend(tinyRouter())
app.use(bodyParser())
app.use(json())

app.post('/todos', async (ctx) => {
  ctx.res.body = { title: ctx.req.body.title }
})

export default app
```

## `env` and execution context

In hoajs route/middleware code:

```js
ctx.env.KV
ctx.env.R2
ctx.env.DB
ctx.executionCtx.waitUntil(promise)
```

Here `ctx` is the hoajs request context. `ctx.executionCtx` is the per-request execution context passed into `app.fetch(request, env, executionCtx)`. Use `ctx.executionCtx.waitUntil(...)` for non-critical background work kicked off by a request. Do not depend on non-awaited background tasks for user-visible results.

## Export patterns

### Fetch only

```js
export default app
```

### Fetch + scheduled

```js
export default {
  fetch: app.fetch,
  async scheduled (event, env, executionCtx) {
    if (event.cron === '*/10 * * * *') {
      await doWork(event, env, executionCtx)
    }
  }
}
```

In `scheduled(event, env, executionCtx)`, `executionCtx` is Cloudflare's `ExecutionContext`, not hoajs request `ctx`. Await work that must finish during the scheduled event; use `executionCtx.waitUntil(...)` for background cleanup work.

### Custom fetch dispatch

Use this for WebSocket or Durable Object special paths:

```js
export default {
  async fetch (request, env, executionCtx) {
    const url = new URL(request.url)

    if (url.pathname.endsWith('/ws')) {
      const stub = env.ROOM.get(env.ROOM.idFromName('<room-name>'))
      return stub.fetch(request)
    }

    return app.fetch(request, env, executionCtx)
  }
}
```

## KV

Wrangler placeholder:

```jsonc
{
  "kv_namespaces": [
    { "binding": "KV", "id": "<kv-namespace-id>" }
  ]
}
```

Use:

```js
const data = await ctx.env.KV.get(key, 'json')
await ctx.env.KV.put(key, JSON.stringify(data), { expirationTtl: 86400 })
```

## R2

Wrangler placeholder:

```jsonc
{
  "r2_buckets": [
    { "binding": "R2", "bucket_name": "<bucket-name>" }
  ]
}
```

Upload:

```js
const form = await ctx.req.formData()
const file = form.get('file')
if (!file || typeof file === 'string') ctx.throw(400, 'File is required')

await ctx.env.R2.put(id, file.stream(), {
  httpMetadata: { contentType: file.type || 'application/octet-stream' }
})
```

Download:

```js
const obj = await ctx.env.R2.get(id)
if (!obj) ctx.throw(404, 'File not found')
ctx.res.type = obj.httpMetadata?.contentType || 'application/octet-stream'
ctx.res.body = obj.body
```

## Durable Objects

Wrangler placeholder:

```jsonc
{
  "durable_objects": {
    "bindings": [{ "name": "ROOM", "class_name": "Room" }]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["Room"] }
  ]
}
```

Dispatch:

```js
const id = env.ROOM.idFromName('<room-name>')
const stub = env.ROOM.get(id)
return stub.fetch(request)
```

## D1

Wrangler placeholder:

```jsonc
{
  "d1_databases": [
    { "binding": "DB", "database_name": "<database-name>", "database_id": "<database-id>" }
  ]
}
```

With Drizzle:

```js
import { drizzle } from 'drizzle-orm/d1'

const db = drizzle(ctx.env.DB)
```

## Cron triggers

```jsonc
{
  "triggers": { "crons": ["*/10 * * * *"] }
}
```

```js
export default {
  fetch: app.fetch,
  async scheduled (event, env, executionCtx) {
    executionCtx.waitUntil(doScheduledWork(event, env))
  }
}
```

## Email Workers

Only add `email()` for Email Routing scenarios:

```js
export default {
  fetch: app.fetch,
  async email (message, env, ctx) {
    // parse inbound email
  }
}
```

## Wrangler template

Always use placeholders in public output:

```jsonc
{
  "name": "<worker-name>",
  "main": "src/index.js",
  "compatibility_date": "<yyyy-mm-dd>",
  "vars": { "ENV": "development" }
}
```

Use `wrangler secret put <NAME>` for sensitive values.

## Cloudflare mistakes to avoid

For full anti-patterns and corrected examples, read `anti-patterns.md`.

- Do not put real IDs, domains, tokens, database URLs, logs, or request samples into public examples.
- Do not use Node-only APIs in Workers examples unless compatibility is explicit and explained.
- Do not forget to fall back to `app.fetch(request, env, executionCtx)` after custom Durable Object/WebSocket dispatch when your custom Worker fetch handler uses `executionCtx` as its third parameter.
- Verify `@hoajs/context-storage` runtime compatibility before recommending it for Workers because it uses `node:async_hooks`.
- Use `@hoajs/tiny-router` by default for lightweight Worker examples.
