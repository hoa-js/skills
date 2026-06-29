# hoajs Overview

Read this when the user asks what hoajs is, how the ecosystem is organized, or how hoajs differs from Hono/Koa/Express.

## What hoajs is

hoajs is a minimal Web framework built around Web Standards. Its core request handler is `app.fetch(request, env, executionCtx)`, and applications produce standard `Response` objects. This makes hoajs suitable for Cloudflare Workers, Deno, Bun, Node.js via adapter, and other Fetch-compatible runtimes.

Basic app:

```js
import { Hoa } from 'hoa'

const app = new Hoa()

app.use(async (ctx) => {
  ctx.res.body = 'Hello, Hoa!'
})

export default app
```

## Ecosystem shape

The public hoajs ecosystem is multi-repository:

- Core framework: `hoa`.
- Routing: `@hoajs/router`, `@hoajs/tiny-router`.
- Adapter: `@hoajs/adapter` for Node.js `listen` support.
- Middleware: request/response, security, validation, cache, observability, view rendering, etc.
- Docs: `website`, `llms.txt`, `llms-full.txt`.
- Examples: Cloudflare Workers examples under `examples`.

Use `repo-map.md` for repository details.

## Key mental model

- `Hoa` manages a middleware stack.
- `ctx` is the per-request context.
- `ctx.req` wraps the incoming Web `Request`.
- `ctx.res` builds the outgoing Web `Response`.
- `ctx.state` shares data across middlewares.
- `ctx.env` exposes runtime environment bindings.
- `ctx.executionCtx` exposes the per-request execution context passed into `app.fetch(request, env, executionCtx)`. In Cloudflare Workers fetch handlers, this usually comes from the third handler argument; it is not the same thing as the separate `ExecutionContext` argument in `scheduled(...)` handlers.

## Difference from Hono / Koa / Express

Do not assume Hono, Koa, or Express APIs exist. Koa has a similar `(ctx, next)` middleware shape, but its context properties are different; remap Koa `ctx.body`, `ctx.status`, `ctx.set(...)`, and `ctx.request.body` to hoajs `ctx.res.*` and `ctx.req.*` APIs.

Hono-style code:

```js
app.get('/', c => c.json({ ok: true }))
```

hoajs-style code:

```js
app.get('/', async (ctx) => {
  ctx.res.body = { ok: true }
})
```

Express-style code:

```js
app.use((req, res) => res.json({ ok: true }))
```

hoajs-style code:

```js
app.use(async (ctx) => {
  ctx.res.body = { ok: true }
})
```

## Routing is an extension

Core `hoa` does not define `app.get` or `app.post`. Add routing with an extension:

```js
import { tinyRouter } from '@hoajs/tiny-router'

app.extend(tinyRouter())
app.get('/users/:id', async (ctx) => {
  ctx.res.body = { id: ctx.req.params.id }
})
```

Use `routing.md` for details.

## Public-output rule

This skill must only contain public hoajs ecosystem knowledge and generic engineering guidance. Do not include any private project information, real Cloudflare IDs, domains, tokens, logs, or request/response samples.
