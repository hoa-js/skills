# hoajs Architecture

Read this for the core `hoa` runtime model: `Hoa`, middleware, context creation, response building, errors, and Node adapter.

## Core files

Public core concepts come from:

- `hoa/src/hoa.js`
- `hoa/src/context.js`
- `hoa/src/request.js`
- `hoa/src/response.js`
- `hoa/src/lib/compose.js`
- `hoa/src/lib/http-error.js`

## Exports

`hoa` exports:

```js
Hoa
HoaContext
HoaRequest
HoaResponse
HttpError
compose
statusTextMapping
statusRedirectMapping
statusEmptyMapping
```

Typical import:

```js
import { Hoa } from 'hoa'
```

## `Hoa`

```js
const app = new Hoa({ name: 'Hoa' })
```

Important properties:

- `app.name`
- `app.HoaContext`
- `app.HoaRequest`
- `app.HoaResponse`
- `app.middlewares`
- `app.fetch`

### `app.use(fn)`

Registers middleware. `fn` must be a function.

```js
app.use(async (ctx, next) => {
  await next()
})
```

### `app.extend(fn)`

Runs an app extension. Use this for packages that modify the app or prototypes.

```js
app.extend(tinyRouter())
app.extend(cookie())
app.extend(nodeServer())
```

### `app.fetch(request, env, executionCtx)`

Main Web Standards request handler. It:

1. creates a context,
2. composes the middleware stack,
3. runs middleware,
4. returns a standard `Response`.

Cloudflare Workers can export the app directly:

```js
export default app
```

Or export handlers:

```js
export default {
  fetch: app.fetch,
  async scheduled (event, env, executionCtx) {}
}
```

In a fetch request, hoajs stores the third `app.fetch(request, env, executionCtx)` argument on `ctx.executionCtx`. In the scheduled handler above, `executionCtx` is Cloudflare's event `ExecutionContext`, not hoajs request `ctx`.

## Context graph

`createContext()` links objects like this:

```text
ctx.app -> app
ctx.req -> HoaRequest
ctx.res -> HoaResponse
ctx.request -> original Request
ctx.env -> env
ctx.executionCtx -> executionCtx

req.ctx -> ctx
req.res -> res
req.app -> app

res.ctx -> ctx
res.req -> req
res.app -> app
```

## `HoaContext`

Context fields:

- `ctx.request`: original Web `Request`.
- `ctx.env`: runtime bindings/environment.
- `ctx.executionCtx`: per-request execution context passed into `app.fetch(...)`.
- `ctx.state`: shared object for middleware state.
- `ctx.req`: `HoaRequest`.
- `ctx.res`: `HoaResponse`.

Error helpers:

```js
ctx.throw(400, 'Bad Request')
ctx.assert(user, 401, 'Unauthorized')
```

## Response building

`ctx.response` builds a standard `Response` from `ctx.res`.

It handles:

- `HEAD` requests.
- empty-body statuses such as 204/205/304.
- `null` / `undefined` body.
- string, `Blob`, `ArrayBuffer`, typed arrays, `ReadableStream`, `FormData`, `URLSearchParams`.
- existing `Response` objects.
- plain objects via `JSON.stringify`.

## Middleware compose

Middleware signature:

```js
async function middleware (ctx, next) {
  // before
  await next()
  // after
}
```

`compose(middlewares)`:

- requires an array,
- flattens one nested level,
- requires every item to be a function,
- returns a composed dispatcher.

## Error model

### `HttpError`

```js
ctx.throw(401, 'Unauthorized', {
  headers: { 'WWW-Authenticate': 'Bearer realm="hoa"' }
})
```

Rules:

- status must be an integer.
- invalid status outside 400–599 becomes 500.
- `expose` defaults to `status < 500`.
- supports `headers` and `cause`.

### `app.onerror(err, ctx)`

Default behavior:

- ignores 404/exposed errors for logging,
- respects `app.silent`,
- logs unexpected errors to console.

### `ctx.onerror(err)`

Builds an error response, resets headers, applies `err.headers`, sets text content, chooses a valid status, and hides non-exposed error messages.

## Node adapter

`@hoajs/adapter` provides `nodeServer()`:

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

It uses Node `http.createServer` and `@whatwg-node/server` to adapt standard Fetch requests to Node.

## Critical generation rules

For full anti-patterns and corrected examples, read `anti-patterns.md`.

- Do not use `app.get` unless `router()` or `tinyRouter()` has been extended.
- Do not use Hono `c.json()` or Express `res.json()`.
- Use `ctx.res.body`, `ctx.res.status`, `ctx.res.type`, and `ctx.res.set(...)`.
- Use `ctx.req.*` for request data.
