# hoajs Recipes

Read this when the user asks for concrete hoajs snippets, starting templates, migration examples, or step-by-step implementation patterns. These recipes are intentionally small and public; adapt them after inspecting the target repository.

## Recipe index

| Task | Start with | Also read |
|---|---|---|
| Minimal app | Minimal Worker app | `overview.md`, `api.md` |
| Route handlers | Route params and query | `routing.md` |
| JSON API | JSON POST route | `routing.md`, `middleware.md` |
| Request validation | Body validation route | `validation.md` |
| Middleware package | Middleware factory skeleton | `middleware.md`, `testing.md`, `code-style.md` |
| Auth/security | Basic auth or JWT route | `security.md` |
| Cloudflare storage | KV/R2/D1 snippets | `cloudflare.md`, `examples.md` |
| Cron/WebSocket/DO | Custom Worker export | `cloudflare.md` |
| Node server | Node adapter listen | `architecture.md` |
| Migration | Hono/Express to hoajs | `anti-patterns.md` |
| Dependency report | Classification table | `dependencies.md` |

## Minimal Worker app

Use this for a small Fetch-compatible app or Cloudflare Worker.

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

Dependencies:

```bash
npm i hoa @hoajs/tiny-router
```

## Route params and query

Precondition: install `@hoajs/router` or `@hoajs/tiny-router` with `app.extend(...)` before reading `ctx.req.params`.

```js
app.get('/users/:id', async (ctx) => {
  const { id } = ctx.req.params
  const { include } = ctx.req.query

  ctx.res.body = { id, include }
})
```

Remember: `ctx.req.params` exists after installing `@hoajs/router` or `@hoajs/tiny-router` with `app.extend(...)`.

## JSON POST route

Use `@hoajs/bodyparser` when multiple middlewares or handlers need parsed body data.

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
  const { title } = ctx.req.body

  if (!title) ctx.throw(400, 'Title is required')

  ctx.res.body = { title }
})

export default app
```

Dependencies:

```bash
npm i hoa @hoajs/tiny-router @hoajs/bodyparser @hoajs/json
```

## Read request body once

For very small handlers, parsing directly is fine, but do not read the request stream twice.

```js
app.post('/echo', async (ctx) => {
  const body = await ctx.req.json()
  ctx.res.body = body
})
```

If downstream middleware also needs the body, use `bodyParser()` and read `ctx.req.body`.

## Body validation route

Preconditions:

- Install routing first if the final handler also relies on `ctx.req.params`.
- Install `@hoajs/bodyparser` before validation so `ctx.req.body` exists.
- Keep validator-specific schema helpers aligned with the target project's current validator style.

Zod example:

```js
import { z, zodValidator } from '@hoajs/zod'

app.use(bodyParser())

app.post(
  '/todos',
  zodValidator({
    body: z.object({
      title: z.string().min(1)
    })
  }),
  async (ctx) => {
    ctx.res.body = { title: ctx.req.body.title }
  }
)
```

Dependency note: `zod` is a peer dependency for the consuming app.

Nana example:

```js
import { nanaValidator } from '@hoajs/nana'
import { object, string } from 'nana'

app.use(bodyParser())

app.post(
  '/todos',
  nanaValidator({
    body: object({
      title: string()
    })
  }),
  async (ctx) => {
    ctx.res.body = { title: ctx.req.body.title }
  }
)
```

## Middleware factory skeleton

Use this when creating a hoajs middleware package or app-local middleware.

```js
export function requestId (options = {}) {
  const opts = { headerName: 'x-request-id', ...options }

  return async function requestIdMiddleware (ctx, next) {
    const requestId = ctx.req.get(opts.headerName) || crypto.randomUUID()

    ctx.state.requestId = requestId
    ctx.res.set(opts.headerName, requestId)

    await next()
  }
}

export default requestId
```

Package checklist:

- Export a named function and default export when matching official middleware style.
- Use `app.use(requestId())` because this returns request middleware.
- Add tests that call `app.fetch(new Request(...))`.
- Update README options and examples when public behavior changes.

## App extension skeleton

Use an extension when modifying the app instance or prototypes instead of participating directly in the request chain.

```js
export function helperExtension () {
  return function installHelper (app) {
    app.helper = function helper () {
      return 'value'
    }
  }
}

export default helperExtension
```

Install with:

```js
app.extend(helperExtension())
```

Do not register app extensions with `app.use(...)`.

## Basic auth

```js
import { basicAuth } from '@hoajs/basic-auth'

app.use(basicAuth({
  username: '<username>',
  password: '<password>'
}))

app.get('/admin', async (ctx) => {
  ctx.res.body = { ok: true }
})
```

Use placeholders in public examples. Do not hard-code real passwords or tokens.

## JWT auth

Precondition: `ctx.state.user` is populated only after the JWT middleware succeeds. If the route uses `app.get(...)`, install routing first.

```js
import { jwt } from '@hoajs/jwt'

app.use(jwt({ secret: '<jwt-secret>' }))

app.get('/me', async (ctx) => {
  ctx.res.body = { user: ctx.state.user }
})
```

For Cloudflare Workers, store real secrets with Wrangler secrets rather than `vars`:

```bash
wrangler secret put JWT_SECRET
```

## KV read/write route

Preconditions:

- Install routing first so `ctx.req.params` exists.
- Install `@hoajs/bodyparser` before the write route if you read `ctx.req.body`.
- Bind `KV` in the Worker environment before using `ctx.env.KV`.

```js
app.get('/items/:id', async (ctx) => {
  const item = await ctx.env.KV.get(`item:${ctx.req.params.id}`, 'json')

  if (!item) ctx.throw(404, 'Item not found')

  ctx.res.body = item
})

app.post('/items/:id', async (ctx) => {
  await ctx.env.KV.put(
    `item:${ctx.req.params.id}`,
    JSON.stringify(ctx.req.body),
    { expirationTtl: 86400 }
  )

  ctx.res.body = { ok: true }
})
```

Wrangler placeholder:

```jsonc
{
  "kv_namespaces": [
    { "binding": "KV", "id": "<kv-namespace-id>" }
  ]
}
```

## R2 upload/download routes

Preconditions:

- Install routing first so `ctx.req.params` exists.
- Bind `R2` in the Worker environment before using `ctx.env.R2`.

```js
app.post('/files/:id', async (ctx) => {
  const form = await ctx.req.formData()
  const file = form.get('file')

  if (!file || typeof file === 'string') ctx.throw(400, 'File is required')

  await ctx.env.R2.put(ctx.req.params.id, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' }
  })

  ctx.res.body = { ok: true }
})

app.get('/files/:id', async (ctx) => {
  const obj = await ctx.env.R2.get(ctx.req.params.id)

  if (!obj) ctx.throw(404, 'File not found')

  ctx.res.type = obj.httpMetadata?.contentType || 'application/octet-stream'
  ctx.res.body = obj.body
})
```

Wrangler placeholder:

```jsonc
{
  "r2_buckets": [
    { "binding": "R2", "bucket_name": "<bucket-name>" }
  ]
}
```

## D1 with Drizzle

Preconditions:

- Bind `DB` in the Worker environment before using `ctx.env.DB`.
- Import the target app schema/table definitions before writing concrete queries.

```js
import { drizzle } from 'drizzle-orm/d1'

app.get('/items', async (ctx) => {
  const db = drizzle(ctx.env.DB)
  const rows = await db.select().from(items)

  ctx.res.body = rows
})
```

Wrangler placeholder:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "<database-name>",
      "database_id": "<database-id>"
    }
  ]
}
```

Inspect the target app schema before generating concrete Drizzle table code.

## Cron Worker export

Use object export when the Worker also handles scheduled events. In fetch requests, hoajs exposes the per-request execution context as `ctx.executionCtx`. In `scheduled(event, env, executionCtx)`, the third argument is Cloudflare's event `ExecutionContext`, not hoajs request `ctx`.

```js
export default {
  fetch: app.fetch,
  async scheduled (event, env, executionCtx) {
    if (event.cron === '*/10 * * * *') {
      executionCtx.waitUntil(doScheduledWork(event, env))
    }
  }
}
```

Use `await` for scheduled work that must complete before the handler finishes; use `executionCtx.waitUntil(...)` for non-critical cleanup/background work.

Wrangler placeholder:

```jsonc
{
  "triggers": { "crons": ["*/10 * * * *"] }
}
```

## Durable Object or WebSocket dispatch

Use custom `fetch` dispatch for special paths, then fall back to the hoajs app.

```js
export default {
  async fetch (request, env, executionCtx) {
    const url = new URL(request.url)

    if (url.pathname.endsWith('/ws')) {
      const id = env.ROOM.idFromName('<room-name>')
      const stub = env.ROOM.get(id)
      return stub.fetch(request)
    }

    return app.fetch(request, env, executionCtx)
  }
}
```

The fallback is important; otherwise normal hoajs routes stop working.

## Node server with adapter

```js
import { Hoa } from 'hoa'
import { nodeServer } from '@hoajs/adapter'

const app = new Hoa()
app.extend(nodeServer())

app.use(async (ctx) => {
  ctx.res.body = 'Hello, Hoa!'
})

app.listen(3000)
```

## Test an app or middleware

```js
import { Hoa } from 'hoa'
import { requestId } from '../src/index.js'

test('sets request id header', async () => {
  const app = new Hoa()
  app.use(requestId())
  app.use(async (ctx) => {
    ctx.res.body = 'ok'
  })

  const res = await app.fetch(new Request('http://localhost/'))

  expect(res.status).toBe(200)
  expect(res.headers.get('x-request-id')).toBeTruthy()
  expect(await res.text()).toBe('ok')
})
```

For route tests, install the router as a dev dependency and use `app.extend(tinyRouter())` or `app.extend(router())`.

## Hono to hoajs migration

Hono source:

```js
import { Hono } from 'hono'

const app = new Hono()

app.get('/todos/:id', (c) => {
  return c.json({ id: c.req.param('id') })
})
```

hoajs target:

```js
import { Hoa } from 'hoa'
import { tinyRouter } from '@hoajs/tiny-router'

const app = new Hoa()
app.extend(tinyRouter())

app.get('/todos/:id', async (ctx) => {
  ctx.res.body = { id: ctx.req.params.id }
})

export default app
```

Migration mapping:

| Hono / Express habit | hoajs pattern |
|---|---|
| `new Hono()` | `new Hoa()` |
| `c.json(value)` | `ctx.res.body = value` |
| `c.text(value)` | `ctx.res.body = value` |
| `c.req.param('id')` | `ctx.req.params.id` |
| Express `(req, res)` | hoajs `(ctx, next)` |
| `res.json(value)` | `ctx.res.body = value` |

## Koa to hoajs migration

Koa and hoajs both use middleware-shaped handlers, but their context properties differ. Preserve the `(ctx, next)` flow and remap response/request APIs.

Koa source:

```js
router.post('/todos', async (ctx) => {
  const body = ctx.request.body

  if (!body.title) ctx.throw(400, 'Title is required')

  ctx.status = 201
  ctx.body = { title: body.title }
})
```

hoajs target:

```js
import { Hoa } from 'hoa'
import { tinyRouter } from '@hoajs/tiny-router'
import { bodyParser } from '@hoajs/bodyparser'

const app = new Hoa()
app.extend(tinyRouter())
app.use(bodyParser())

app.post('/todos', async (ctx) => {
  const { title } = ctx.req.body || {}

  if (!title) ctx.throw(400, 'Title is required')

  ctx.res.status = 201
  ctx.res.body = { title }
})

export default app
```

Migration mapping:

| Koa habit | hoajs pattern |
|---|---|
| `ctx.body = value` | `ctx.res.body = value` |
| `ctx.status = code` | `ctx.res.status = code` |
| `ctx.set(name, value)` | `ctx.res.set(name, value)` |
| `ctx.request.body` | `ctx.req.body` after `@hoajs/bodyparser`, or `await ctx.req.json()` |
| `ctx.query` | `ctx.req.query` |
| koa-router params | `ctx.req.params` after `app.extend(router())` or `app.extend(tinyRouter())` |
| Koa router registration | hoajs route helpers only after a router extension |

## Dependency classification report

Use this structure when the user asks which dependencies are required:

```md
| Dependency | Declared in | Observed usage | Classification | Notes |
|---|---|---|---|---|
| `hoa` | peerDependencies / devDependencies | src and tests | peer + dev-for-tests | User app provides `hoa`; repo installs locally for tests/builds. |
| `@hoajs/tiny-router` | devDependencies | tests only | test-only | Do not list in user install docs unless runtime code imports it. |
```

Do not move or remove unclear dependencies without maintainer confirmation.

## Final recipe checks

Before returning a recipe-based answer:

- Confirm routes are installed with `app.extend(router())` or `app.extend(tinyRouter())`.
- Use `ctx.res.body`, `ctx.res.status`, `ctx.res.type`, and `ctx.res.set(...)`.
- Use `ctx.req.*` for request data.
- Use `app.use(...)` for middleware and `app.extend(...)` for extensions.
- Include only dependencies that the snippet actually needs.
- Use placeholders for Cloudflare IDs, domains, secrets, tokens, database names, and bucket names.
- Do not copy private project names, routes, fields, logs, or request/response samples into public output.
