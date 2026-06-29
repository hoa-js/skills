# Testing hoajs Packages

Read this when adding or updating tests for hoajs apps, middleware, router behavior, or package changes.

## Common test model

Most tests drive the app through `app.fetch(new Request(...))` rather than starting a server. When asked for hoajs tests or test strategy, make this the primary example; curl is useful only as an extra manual smoke test.

```js
import { Hoa } from 'hoa'
import { middleware } from '../src/index.js'

test('works', async () => {
  const app = new Hoa()
  app.use(middleware())
  app.use(async (ctx) => {
    ctx.res.body = 'ok'
  })

  const res = await app.fetch(new Request('http://localhost/'))
  expect(res.status).toBe(200)
  expect(await res.text()).toBe('ok')
})
```

## Testing routes

If a middleware test needs routes, tests may install `@hoajs/router` or `@hoajs/tiny-router` as dev dependencies.

```js
app.extend(tinyRouter())
app.get('/items/:id', async (ctx) => {
  ctx.res.body = ctx.req.params.id
})
```

Do not treat router packages used only in tests as runtime dependencies.

## Testing body parsing

```js
const res = await app.fetch(new Request('http://localhost/items', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ title: 'a' })
}))
```

## Testing errors

Use status and body assertions:

```js
expect(res.status).toBe(400)
expect(await res.text()).toContain('Bad Request')
```

If `@hoajs/json` wraps errors, assert the JSON envelope instead.

## Jest config patterns

JS packages often use ESM Jest config with:

- `testEnvironment: 'node'`
- `testMatch: ['**/__test__/**/*.js']`
- `collectCoverage: true`
- `transform: {}`
- `moduleNameMapper` for `.js` import mapping

TS packages often use `ts-jest` with ESM:

- `preset: 'ts-jest/presets/default-esm'`
- `extensionsToTreatAsEsm: ['.ts']`
- `testMatch: ['**/__test__/**/*test.ts']`

Common test command:

```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

## What to test for middleware changes

When adding an option or behavior:

- default behavior,
- custom option behavior,
- invalid option behavior if applicable,
- error path,
- header/body/status effects,
- interaction with `next()` or short-circuit behavior,
- README examples when easy to reproduce.

## Dependency notes

Test-only dependencies belong in dev dependencies and should not be documented as user production requirements.

## Running tests

Before running commands, inspect `package.json` scripts. Prefer the package’s existing script:

```bash
npm test
npm run lint
npm run type-check
```

If package manager is unclear, report what you ran and any failures exactly.
