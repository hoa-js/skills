# hoajs Middleware

Read this when creating, modifying, documenting, or testing official-style hoajs middleware.

## Two extension shapes

### Middleware: use `app.use(...)`

Middleware returns `(ctx, next) => ...` and participates in the request chain.

```js
app.use(bodyParser())
app.use(json())
app.use(cors())
```

Factory pattern:

```js
export function myMiddleware (options = {}) {
  return async function myMiddlewareHandler (ctx, next) {
    await next()
  }
}

export default myMiddleware
```

### App extension: use `app.extend(...)`

Extensions modify the app or prototypes.

```js
app.extend(tinyRouter())
app.extend(cookie())
app.extend(nodeServer())
```

Do not register extensions with `app.use(...)` unless the target package explicitly returns middleware.

## Common middleware behavior

Middleware may:

- inspect `ctx.req`,
- set `ctx.req.body`, `ctx.req.params`, or other fields,
- set `ctx.res.status`, headers, type, and body,
- use `ctx.state` for shared state,
- throw `ctx.throw(...)`,
- catch downstream errors,
- short-circuit without calling `next()`.

## Options pattern

Common pattern:

```js
const defaults = { enabled: true }
const opts = { ...defaults, ...options }
```

Options may be literal values or functions. Document whether functions can be async.

Default to the smallest options surface that satisfies the user request. Do not add extra options, validation, fallback generators, or abstractions unless the target package already has that pattern or the user asks for them.

When adding an option, update:

- JSDoc/types,
- README options table,
- tests,
- examples if behavior is public.

## Request mutation patterns

### Body parsing

`@hoajs/bodyparser` parses body by content type and writes:

```js
ctx.req.body = parsed
```

It supports JSON, form, multipart, and text. It uses `Request.clone()` by default to avoid consuming the original stream.

### Router params

Router extensions write:

```js
ctx.req.params = params
ctx.req.routePath = path
```

### Validation

Validator middleware reads and overwrites `ctx.req[key]`:

```js
const value = ctx.req[key]
ctx.req[key] = parsedOrValidatedValue
```

## Response patterns

### Direct response

```js
ctx.res.status = 200
ctx.res.set('X-Foo', 'bar')
ctx.res.body = { ok: true }
```

### JSON envelope

`@hoajs/json` wraps success and error responses. It can be used per route or globally depending on desired behavior.

```js
app.use(json())
```

### Short-circuit

CORS preflight and cache hits may return without `next()`:

```js
ctx.res.status = 204
ctx.res.body = null
return
```

## `ctx.state`

Use `ctx.state` for cross-middleware state. For example, JWT middleware stores verified payloads under `ctx.state.user` by default and metadata under `ctx.state.jwt`.

## Error handling

Prefer:

```js
ctx.throw(400, 'Bad Request')
```

For auth failures, include headers when needed:

```js
ctx.throw(401, 'Unauthorized', {
  headers: { 'WWW-Authenticate': 'Bearer realm="hoa"' }
})
```

Avoid exposing stack traces or private details in public errors.

## Package-specific cautions

Use these as risk reminders, not as complete API documentation. For exact options and behavior, inspect the target package source and README.

| Package | Shape | Caution |
|---|---|---|
| `@hoajs/bodyparser` | middleware | Runtime dependency `qs-esm`; parse body before validation; avoid reading request body twice. |
| `@hoajs/json` | middleware | Wraps success/error responses; distinguish raw `ctx.res.body` from JSON envelope expectations. |
| `@hoajs/cookie` | app extension | Register with `app.extend(cookie())`, not `app.use(cookie())`; avoid real cookie values in examples. |
| `@hoajs/cache` | middleware | Check cache key, method, and short-circuit behavior; ensure downstream `next()` behavior matches target package. |
| `@hoajs/combine` | middleware composition | Preserve middleware order and error propagation; add composition tests when changing behavior. |
| `@hoajs/compress` | middleware | Verify runtime support for compression APIs before recommending it in edge runtimes. |
| `@hoajs/etag` | middleware | Ensure ETag calculation matches response body semantics; do not treat router test deps as runtime deps. |
| `@hoajs/vary` | middleware/helper | Header-focused package; test header merging rather than only body output. |
| `@hoajs/method-override` | middleware | Verify where override data is read from and how it mutates request method. |
| `@hoajs/timeout` | middleware | Timeout behavior is error-sensitive; document status/error shape and test slow downstream handlers. |
| `@hoajs/context-storage` | context middleware | Uses Node async context mechanisms; verify Cloudflare/edge runtime compatibility before recommending for Workers. |
| `@hoajs/formidable` | form/file middleware | Depends on `formidable` and is Node-oriented; verify runtime before using in Workers examples. |
| `@hoajs/mustache` | view extension | Depends on `mustache`; inspect template/render API before generating concrete view code. |
| `@hoajs/language` | middleware | Depends on cookie helpers; classify `@hoajs/cookie` as peer/dev according to target package and example usage. |
| `@hoajs/cloudflare-rate-limit` | Cloudflare middleware | Requires KV binding; Wrangler examples must use placeholder namespace IDs and generic routes. |
| `@hoajs/sentry` | observability middleware | Toucan/Sentry setup is sensitive; never show real DSNs/tokens and inspect target README before generating setup. |
| `@hoajs/basic-auth` / `@hoajs/jwt` / `@hoajs/csrf` / `@hoajs/secure-headers` / `@hoajs/ip` | security middleware | Read `security.md`; add success/failure tests and avoid exposing secrets, IPs, or stack traces. |
| `@hoajs/nana` / `@hoajs/zod` / `@hoajs/valibot` | validation middleware | Read `validation.md`; body validation usually needs `@hoajs/bodyparser` first. |

## Package patterns

Most official middleware packages:

- use ESM,
- export named function and default export,
- use `hoa` as peer dependency,
- use `tsdown` for builds,
- use `eslint` + `neostandard`,
- use `jest` for tests.

## README pattern

Recommended README sections:

1. package title and one-line description,
2. Quick Start,
3. Options table,
4. Examples,
5. Error Handling / Security Notes when relevant.

Do not add test-only dependencies to user install instructions.

## Middleware development workflow

1. Read target `package.json`.
2. Determine JS vs TS.
3. Read `src/` entry and existing exports.
4. Read tests and README.
5. Classify new dependencies.
6. Modify source.
7. Add/update tests.
8. Update README.
9. Run lint/test/type-check if available.

## Common middleware mistakes

For full anti-patterns and corrected examples, read `anti-patterns.md`.

- Do not register app extensions such as `cookie()` or `tinyRouter()` with `app.use(...)`.
- Do not treat test-only router deps as runtime deps.
- Do not use Hono `c.json()` or Express `res.json()`.
- Do not change package fields without matching the target repo’s existing build style.
