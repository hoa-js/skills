# Security and Auth in hoajs

Read this for `@hoajs/basic-auth`, `@hoajs/jwt`, `@hoajs/csrf`, `@hoajs/secure-headers`, `@hoajs/ip`, error exposure, secrets, and public-output redaction.

## General error and privacy rule

Use `ctx.throw(status, message, options)` for HTTP errors:

```js
ctx.throw(401, 'Unauthorized', {
  headers: { 'WWW-Authenticate': 'Bearer realm="hoa"' }
})
```

Do not expose internal stack traces, secrets, database URLs, Cloudflare IDs, tokens, JWTs, real domains, local paths, logs, or request/response samples in public docs or generated skills. The bundled private-leak script is an obvious-leak preflight check; it is not a complete secret scanner and does not replace manual review.

Manual review note:

- `check-no-private-leak.js` may still flag generic IPv4 addresses or local-network teaching examples.
- Treat findings as review prompts, not proof that a release artifact is unsafe.

## `@hoajs/basic-auth`

Use for HTTP Basic Authentication.

```js
import { basicAuth } from '@hoajs/basic-auth'

app.use(basicAuth({ username: '<username>', password: '<password>' }))
```

Supported modes:

- single username/password,
- multiple users,
- custom `verifyUser(ctx, username, password)`,
- custom `realm`,
- custom `hashFunction`,
- custom `invalidUserMessage`.

Failure behavior:

- throws 401,
- sets `WWW-Authenticate`,
- escapes realm quotes.

Security notes:

- Do not hard-code real passwords in public examples.
- Prefer placeholders or secrets in docs.

## `@hoajs/jwt`

Use for JWT authentication.

Preconditions:

- `ctx.state.user` exists only after the JWT middleware runs successfully.
- For Worker examples, use Wrangler secrets or equivalent secret storage for real keys.

```js
import { jwt } from '@hoajs/jwt'

app.use(jwt({ secret: '<jwt-secret>' }))
```

Capabilities:

- Bearer token from `Authorization`.
- Optional cookie token.
- Custom `getToken(ctx)`.
- `credentialsRequired`.
- `passthrough` mode.
- `isRevoked(ctx, payload)`.
- issuer/audience/subject/clockTolerance checks.
- remote JWKS via `jwksUri`.
- payload stored at `ctx.state[key]`, default `ctx.state.user`.
- metadata stored at `ctx.state.jwt`.

Do not write real secrets or JWTs. Use placeholders and Wrangler secrets where applicable.

## `@hoajs/csrf`

Use for CSRF protection. When modifying or documenting it, inspect the target package source and README first. CSRF middleware is security-sensitive, so update tests for success and failure cases and verify any cookie/header/token naming details before generating setup code.

## `@hoajs/secure-headers`

Provides a collection of security header middlewares. It composes individual policies and supports legacy aliases such as:

- `hsts` for Strict-Transport-Security,
- `frameguard` for X-Frame-Options,
- `noSniff` for X-Content-Type-Options,
- `dnsPrefetchControl`,
- `permittedCrossDomainPolicies`,
- `xssFilter`.

Some aliases are mutually exclusive with canonical option names. If both are supplied, the package may throw.

Before generating concrete setup, inspect the target package README/source for the exact option names you plan to mention.

When adding security header options:

- document defaults,
- document aliases,
- add tests for enable/disable behavior,
- avoid unsafe defaults.

## `@hoajs/ip`

Use for IP restriction. hoajs request IP data comes from `ctx.req.ip` and `ctx.req.ips`, which inspect common proxy headers including Cloudflare headers.

When generating examples:

- Explain proxy header trust assumptions.
- Do not use real user IPs.

## Secrets in Cloudflare Workers

Non-sensitive vars can be shown as placeholders in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "ENV": "development"
  }
}
```

Sensitive values should use Wrangler secrets:

```bash
wrangler secret put API_TOKEN
```

Do not put real tokens in `vars`.

## Public examples must be redacted

Use placeholders:

```jsonc
{
  "account_id": "<cloudflare-account-id>",
  "routes": [{ "pattern": "<domain>/*", "zone_name": "<zone-name>" }]
}
```

Never include:

- real account IDs,
- real domains,
- KV/R2/D1/Durable Object IDs,
- database connection strings,
- JWTs,
- authorization headers,
- cookies,
- local filesystem paths,
- logs,
- request/response bodies from real users.

Before publishing, run the bundled leak check when available and still manually inspect public examples for private project names, business fields, routes, and sample data.
