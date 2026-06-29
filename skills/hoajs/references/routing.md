# Routing in hoajs

Read this when the task involves routes, path params, `app.get`, `app.post`, or choosing between `@hoajs/router` and `@hoajs/tiny-router`.

## Routing is not in core `hoa`

Core `hoa` only provides middleware. Add routing through an extension:

```js
import { Hoa } from 'hoa'
import { tinyRouter } from '@hoajs/tiny-router'

const app = new Hoa()
app.extend(tinyRouter())

app.get('/users/:id', async (ctx) => {
  ctx.res.body = { id: ctx.req.params.id }
})
```

## Shared API

Both `@hoajs/router` and `@hoajs/tiny-router` add:

```js
app.options(path, ...handlers)
app.head(path, ...handlers)
app.get(path, ...handlers)
app.post(path, ...handlers)
app.put(path, ...handlers)
app.patch(path, ...handlers)
app.delete(path, ...handlers)
app.all(path, ...handlers)
```

Each route requires at least one handler.

## Handler model

Handlers use normal hoajs middleware signature:

```js
app.post(
  '/todos',
  async (ctx, next) => {
    // before
    await next()
  },
  async (ctx) => {
    ctx.res.body = { ok: true }
  }
)
```

Multiple handlers are composed with `compose`.

## Matching behavior

Route middleware:

1. checks HTTP method,
2. matches `ctx.req.pathname`,
3. sets `ctx.req.params`,
4. sets `ctx.req.routePath`,
5. runs route handlers,
6. calls `next()` when not matched.

`GET` routes also match `HEAD` requests.

## `@hoajs/router`

Use when you need full `path-to-regexp` behavior.

```js
import { router } from '@hoajs/router'

app.extend(router())
```

Package facts:

- Runtime dependency: `path-to-regexp`.
- Peer dependency: `hoa`.

Options include:

- `sensitive`
- `end`
- `delimiter`
- `trailing`

Good for:

- complex route patterns,
- full path-to-regexp semantics,
- non-minimal server apps.

## `@hoajs/tiny-router`

Use for lightweight apps, especially Cloudflare Workers examples.

```js
import { tinyRouter } from '@hoajs/tiny-router'

app.extend(tinyRouter())
```

Package facts:

- Runtime dependencies: none.
- Peer dependency: `hoa`.

Options:

- `sensitive`
- `trailing`

Supports:

- `:name` params,
- `:name+` greedy params,
- `*` wildcard,
- optional trailing slash,
- case-insensitive matching by default.

## Choosing a router

| Use case | Recommendation |
|---|---|
| Cloudflare Worker demo/app | `@hoajs/tiny-router` |
| Minimal app | `@hoajs/tiny-router` |
| Complex path-to-regexp patterns | `@hoajs/router` |
| Existing project already uses one | Keep the existing router |

## JSON route example

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

## Common routing mistakes

For full anti-patterns and corrected examples, read `anti-patterns.md`.

- Do not assume core `hoa` has `app.get/app.post`; extend `router()` or `tinyRouter()` first.
- Do not use Hono `c.json()` or Express `res.json()` in route handlers.
- Keep route handlers in normal hoajs middleware shape: `(ctx, next)`.
