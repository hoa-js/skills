# hoajs Code Style

Read this before generating or modifying hoajs source, tests, README examples, or package metadata.

## General style

- ESM modules.
- `type: module` in package.json.
- neostandard / Standard style.
- No semicolons.
- 2-space indentation.
- Single quotes.
- `async` / `await`.
- Prefer named export plus default export for public middleware.

Example:

```js
export function cors (options = {}) {
  return async function corsMiddleware (ctx, next) {
    await next()
  }
}

export default cors
```

## TypeScript style

Some packages use TypeScript:

```ts
import type { HoaContext, HoaMiddleware } from 'hoa'

export function basicAuth (options: BasicAuthOptions): HoaMiddleware {
  return async function basicAuthMiddleware (ctx: HoaContext, next) {
    await next()
  }
}
```

Do not add TS files to JS-only packages unless the target repo already uses TS or the user asks.

## Imports

Common order:

1. external dependencies,
2. `hoa` / `@hoajs/*`,
3. local files,
4. type imports where applicable.

Match local file extension style in the target repository.

## Package/build style

Common scripts:

```json
{
  "lint": "eslint .",
  "type-check": "tsc --noEmit",
  "build": "tsdown",
  "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
  "prepublishOnly": "npm run type-check && npm run lint && npm run test && npm run build"
}
```

JS packages may not have `type-check`. Always inspect the target package.

## Build output fields

Packages often expose CJS + ESM + types:

```json
{
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.mjs",
  "types": "./dist/esm/index.d.mts"
}
```

Do not rewrite package fields unless required.

## ESLint

Uses `neostandard`, optionally with `ts: true` for TS packages. Avoid unused variables and semicolons.

## README style

Recommended sections:

```md
# @hoajs/package

Short description.

## Quick Start

## Options

## Examples

## Error Handling / Security Notes
```

Use real hoajs APIs in examples:

```js
ctx.res.body = { ok: true }
```

Do not use Hono `c.json()` or Express `res.json()`.

## Examples style

Official examples are often single-file Workers:

```js
const app = new Hoa()
app.extend(tinyRouter())

app.get('/', async (ctx) => {
  ctx.res.type = 'html'
  ctx.res.body = html
})

export default app
```

## Public comments and JSDoc

Add JSDoc for public functions and complex options. Avoid excessive comments for simple code.

## Checklist before finishing a change

- Matches JS/TS style of target repo.
- Uses `app.extend` vs `app.use` correctly.
- Uses `ctx.res.body`, not Hono/Express response helpers.
- New dependencies are correctly classified.
- Tests updated for behavior changes.
- README updated for public API changes.
- Cloudflare examples use placeholders.
- No private/internal project information appears.
