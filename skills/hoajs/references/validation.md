# Validation in hoajs

Read this when the task involves request validation with `@hoajs/nana`, `@hoajs/zod`, or `@hoajs/valibot`.

## Common validator pattern

Validator middleware validates fields on `ctx.req`, such as `body`, `params`, or `query`, then writes parsed/validated values back to `ctx.req[key]`.

The validator libraries themselves (`nana`, `zod`, `valibot`) are companion dependencies, not hoajs APIs. Do not invent complex schema helper names or validator-specific options from memory. For concrete schemas, prefer the target project's existing schema style, the package README, or public validator docs/source. Keep generated examples minimal when exact external validator APIs are not available.

Preconditions:

- If validating `body`, install `@hoajs/bodyparser` first so `ctx.req.body` exists.
- If validating `params`, install routing first with `app.extend(router())` or `app.extend(tinyRouter())` so `ctx.req.params` exists.
- If validating `query`, verify the target package/app reads from `ctx.req.query` and keeps query parsing expectations consistent.

```js
app.post('/items', validator({ body: schema }), async (ctx) => {
  ctx.res.body = ctx.req.body
})
```

Use `@hoajs/bodyparser` before body validation when validating JSON/form body.

## `@hoajs/nana`

Package role: Nana validator middleware for Hoa.

Typical usage:

```js
import { nanaValidator } from '@hoajs/nana'
import { object, string, pipe } from 'nana'

app.use(bodyParser())

app.post(
  '/items',
  nanaValidator({
    body: object({
      name: string()
    })
  }),
  async (ctx) => {
    ctx.res.body = ctx.req.body
  }
)
```

Behavior:

- `schemas` must be an object.
- Each schema must be a function.
- It validates `ctx.req[key]`.
- Failed validation throws an error with status 400 by default.
- Successful validation overwrites `ctx.req[key]` with the result.

Dependency note:

- `nana` is a runtime dependency of `@hoajs/nana`.
- Apps may import `nana` directly when writing schemas.

## `@hoajs/zod`

Package role: Zod validator middleware.

Usage:

```js
import { z, zodValidator } from '@hoajs/zod'

app.use(bodyParser())

app.post(
  '/items',
  zodValidator({
    body: z.object({
      name: z.string()
    })
  }),
  async (ctx) => {
    ctx.res.body = ctx.req.body
  }
)
```

Behavior:

- Schema must support `safeParseAsync`.
- Failure throws `ctx.throw(400, message)`.
- `formatError(err, ctx, key, value)` can customize messages.
- Success overwrites `ctx.req[key]` with parsed data.

Dependency note:

- `zod` is a peer dependency for the user app and a dev dependency for the package repo.

## `@hoajs/valibot`

Package role: Valibot validator middleware.

Usage pattern:

- Install `@hoajs/bodyparser` before body validation.
- Pass schema objects keyed by request field, e.g. `{ body: schema }`.
- On success, expect parsed values to overwrite `ctx.req[key]`, similar to the other hoajs validator adapters.
- For exact Valibot schema helpers and adapter names, inspect the target package source/README or official docs before generating concrete imports.

Behavior:

- Treat it as an external validator adapter rather than a hoajs-native schema API.
- Keep the target project's existing Valibot style instead of translating schemas from memory.
- When exact adapter options are unknown, prefer a short explanation plus dependency guidance over invented code.

Dependency note:

- `valibot` is a peer dependency for the user app and a dev dependency for the package repo.

Use it when the user explicitly prefers Valibot or the target project already uses it.

## Choosing a validator

| Situation | Recommendation |
|---|---|
| Existing project uses one validator | Keep the existing validator |
| User requests Zod | Use `@hoajs/zod` |
| User requests Valibot | Use `@hoajs/valibot` |
| Official examples / nana-style schemas | Use `@hoajs/nana` |

## Common pipeline

```js
app.extend(tinyRouter())
app.use(bodyParser())
app.use(json())

app.post(
  '/todos',
  zodValidator({ body: z.object({ title: z.string() }) }),
  async (ctx) => {
    ctx.res.body = { title: ctx.req.body.title }
  }
)
```

## Common validation mistakes

For full anti-patterns and corrected examples, read `anti-patterns.md`.

- Do not validate `ctx.req.body` before parsing the body.
- Do not treat `zod` or `valibot` as bundled runtime dependencies when they are peers.
- Do not return Hono-style `c.json()` from route handlers.
