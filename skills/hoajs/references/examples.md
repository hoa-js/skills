# hoajs Official Examples

Read this for public example patterns from the `hoajs/examples` repository. Examples are for learning and small app patterns; do not treat them as full production architecture.

## Common pattern

Most examples use:

```js
import { Hoa } from 'hoa'
import { tinyRouter } from '@hoajs/tiny-router'

const app = new Hoa()
app.extend(tinyRouter())

app.get('/', async (ctx) => {
  ctx.res.type = 'html'
  ctx.res.body = html
})

export default app
```

## Example map

| Example | Purpose | Main patterns |
|---|---|---|
| `2fa` | TOTP 2FA demo | minimal app, route params, HTML response |
| `image-transformer` | R2 image upload/serve | `formData()`, file validation, R2 put/get |
| `myip` | IP info service | `ctx.req.ip`, external fetch, env vars |
| `tempboard` | temporary board | KV, cookie last path, frontend bundle |
| `tempchat` | chat room | bodyparser/json/nana, KV, Durable Objects, WebSocket |
| `tempcode` | code sharing | KV, cookie redirect |
| `tempcron` | scheduled task app | bodyparser/json/nana, KV, Cron triggers |
| `tempemail` | temporary inbox | Email Worker, KV, `postal-mime` |
| `tempfile` | file manager | R2, KV metadata, cookie, mustache |
| `tempnote` | temporary notes | KV, cookie redirect, optional password variant |
| `tempproxy` | proxy list | D1, Drizzle, Cron sync, bodyparser |
| `temptable` | temporary spreadsheet | KV, cookie redirect |
| `tempvideo` | realtime video room | Durable Objects, WebSocket, vars |
| `tempvoice` | realtime voice room | Durable Objects, WebSocket, vars |

## Reusable patterns

The snippets below are continuation patterns extracted from public examples. Before copying them into an app, add the imports, middleware setup, schemas, and dependency notes from the relevant reference files (`routing.md`, `middleware.md`, `validation.md`, `cloudflare.md`, or `recipes.md`).

### Minimal route app

```js
const app = new Hoa()
app.extend(tinyRouter())

app.get('/:id', async (ctx) => {
  ctx.res.body = { id: ctx.req.params.id }
})
```

### Cookie last path

```js
app.extend(cookie())

app.use(async (ctx) => {
  const lastPath = await ctx.req.getCookie('last_path')
  ctx.res.redirect(lastPath || '/')
})
```

### HTML + API

```js
app.get('/:path', async (ctx) => {
  ctx.res.type = 'html'
  ctx.res.body = html
})

app.post('/:path', async (ctx) => {
  ctx.res.body = { ok: true }
})
```

### Validation API

```js
app.use(bodyParser())

app.post(
  '/:path',
  nanaValidator({ params: paramsSchema, body: bodySchema }),
  json(),
  async (ctx) => {
    ctx.res.body = ctx.req.body
  }
)
```

## Dependencies by example type

### Minimal Worker

```json
{ "dependencies": { "hoa": "<version>", "@hoajs/tiny-router": "<version>" } }
```

### JSON API

```json
{
  "dependencies": {
    "hoa": "<version>",
    "@hoajs/tiny-router": "<version>",
    "@hoajs/bodyparser": "<version>",
    "@hoajs/json": "<version>"
  }
}
```

### Cookie app

```json
{ "dependencies": { "@hoajs/cookie": "<version>" } }
```

Remember to use `app.extend(cookie())`.

## Cloudflare capabilities shown

- KV: temporary state, indexes, metadata.
- R2: file/image storage.
- Durable Objects: realtime rooms and WebSocket routing.
- D1: structured data with Drizzle.
- Cron triggers: cleanup and scheduled tasks.
- Email Workers: inbound email parsing.
- Vars: non-secret configuration.

## What not to copy directly

Do not directly generalize:

- specific app names or product logic,
- page text and HTML templates,
- external service URLs,
- concrete cron business behavior,
- real identifiers or domains,
- example-specific class names when a placeholder is better.

## Use examples as patterns

When generating code:

- Use `hoa + tinyRouter` for Cloudflare examples.
- Use placeholders for Wrangler bindings.
- Keep examples small and focused.
- For complex production apps, recommend layered structure without copying private project details.
