# hoajs API Quick Reference

Read this when writing code that uses `Hoa`, `ctx`, `ctx.req`, or `ctx.res`.

## `Hoa`

```js
import { Hoa } from 'hoa'

const app = new Hoa()
```

### `app.use(fn)`

Register middleware:

```js
app.use(async (ctx, next) => {
  await next()
})
```

### `app.extend(fn)`

Install app extensions:

```js
app.extend(tinyRouter())
app.extend(cookie())
app.extend(nodeServer())
```

### `app.fetch(request, env, executionCtx)`

Fetch-compatible handler. Cloudflare Workers can do:

```js
export default app
```

or:

```js
export default { fetch: app.fetch }
```

## `ctx`

Common fields:

```js
ctx.app
ctx.request        // original Request
ctx.req            // HoaRequest
ctx.res            // HoaResponse
ctx.env            // runtime bindings
ctx.executionCtx   // per-request execution context passed into app.fetch(...)
ctx.state          // shared state
```

### Errors

```js
ctx.throw(400, 'Bad Request')
ctx.assert(value, 400, 'Bad Request')
```

## `ctx.req`

### URL

```js
ctx.req.href
ctx.req.origin
ctx.req.protocol
ctx.req.host
ctx.req.hostname
ctx.req.port
ctx.req.pathname
ctx.req.search
ctx.req.hash
ctx.req.query
```

Many URL fields are settable, so middleware can rewrite them.

### Method

```js
ctx.req.method
ctx.req.method = 'POST'
```

### Headers

```js
ctx.req.get('content-type')
ctx.req.has('authorization')
ctx.req.set('x-foo', 'bar')
ctx.req.append('x-foo', 'bar')
ctx.req.delete('x-foo')
ctx.req.getSetCookie()
```

### Body

```js
ctx.req.body
await ctx.req.blob()
await ctx.req.arrayBuffer()
await ctx.req.text()
await ctx.req.json()
await ctx.req.formData()
```

Request body streams are generally single-use. Prefer `@hoajs/bodyparser` for shared parsed `ctx.req.body`.

### IP

```js
ctx.req.ip
ctx.req.ips
```

`ip` checks common proxy headers including `x-forwarded-for`, `cf-connecting-ip`, `x-real-ip`, and related headers.

### Router-added fields

When using `@hoajs/router` or `@hoajs/tiny-router`:

```js
ctx.req.params
ctx.req.routePath
```

## `ctx.res`

### Status

```js
ctx.res.status = 200
ctx.res.statusText = 'OK'
```

Default status is 404. Setting `ctx.res.body` without an explicit status usually sets status to 200.

### Headers

```js
ctx.res.get('content-type')
ctx.res.has('cache-control')
ctx.res.set('cache-control', 'no-store')
ctx.res.set({ 'Cache-Control': 'no-store', Pragma: 'no-cache' })
ctx.res.append('Vary', 'Origin')
ctx.res.delete('content-type')
ctx.res.getSetCookie()
```

### Body

```js
ctx.res.body = 'text'
ctx.res.body = '<h1>Hello</h1>'
ctx.res.body = { ok: true }
ctx.res.body = new Response('ok')
ctx.res.body = stream
```

Supported body types include string, object, `Blob`, `ArrayBuffer`, typed arrays, `ReadableStream`, `FormData`, `URLSearchParams`, and `Response`.

### Content type

```js
ctx.res.type = 'text'
ctx.res.type = 'html'
ctx.res.type = 'json'
ctx.res.type = 'application/custom'
```

### Redirect

```js
ctx.res.redirect('/login')
ctx.res.back('/')
```

### Length

```js
ctx.res.length
ctx.res.length = 123
```

## Common snippets

### Basic JSON response

```js
app.use(async (ctx) => {
  ctx.res.body = { ok: true }
})
```

### Read JSON body once

```js
app.post('/items', async (ctx) => {
  const body = await ctx.req.json()
  ctx.res.body = body
})
```

### Use bodyparser

```js
app.use(bodyParser())

app.post('/items', async (ctx) => {
  ctx.res.body = ctx.req.body
})
```

## Non-APIs to avoid

For full anti-patterns and corrected examples, read `anti-patterns.md`.

Do not generate these unless explicitly converting from another framework and labeling them as source code:

```js
c.json()
c.text()
new Hono()
res.json()
req.params
```
