# hoajs Repository Map

Read this when the user asks about hoajs repository structure, package responsibilities, or which reference to consult.

## P0: core understanding

| Repository | Package | Role | Read next |
|---|---|---|---|
| `hoa` | `hoa` | Core framework: `Hoa`, `ctx`, `req`, `res`, middleware, errors | `architecture.md`, `api.md` |
| `router` | `@hoajs/router` | Full router using `path-to-regexp` | `routing.md` |
| `tiny-router` | `@hoajs/tiny-router` | Lightweight router, common in Cloudflare examples | `routing.md`, `cloudflare.md` |
| `adapter` | `@hoajs/adapter` | Node.js adapter, adds `app.listen` | `architecture.md` |
| `website` | `hoa-js.com` | Official docs source; generates `llms.txt` / `llms-full.txt` | relevant references, plus official docs freshness workflow in `SKILL.md` |

## P1: examples and Cloudflare focus

| Repository | Role | Read next |
|---|---|---|
| `examples` | Cloudflare Workers example apps | `examples.md`, `cloudflare.md` |
| `cloudflare-rate-limit` | Cloudflare KV rate limit middleware | `cloudflare.md`, `middleware.md` |

## P2: middleware ecosystem

### Request / response

- `bodyparser` → parse JSON/form/text/multipart into `ctx.req.body`.
- `json` → wrap successful/error responses in JSON envelopes.
- `compress` → response compression.
- `etag` → ETag support.
- `vary` → Vary header helper.
- `cookie` → app extension adding cookie helpers to request/response prototypes.
- `method-override` → override request method.
- `timeout` → timeout middleware.

### Security / auth

- `basic-auth` → HTTP Basic auth.
- `csrf` → CSRF middleware.
- `jwt` → JWT verification/signing helpers using `jose`.
- `secure-headers` → security headers collection.
- `ip` → IP restriction.

### Observability / context

- `logger`.
- `request-id`.
- `response-time`.
- `powered-by`.
- `context-storage` → AsyncLocalStorage context access.
- `sentry` → Sentry/Toucan integration.

### Static / form / view

- `favicon`.
- `formidable` → form/file handling, Node-oriented scenarios.
- `mustache` → Mustache view rendering extension.

### Validation

- `nana` → Nana validator middleware.
- `zod` → Zod validator adapter.
- `valibot` → Valibot validator adapter.

### i18n

- `language` → language detection; depends on cookie helpers.

## Coverage strategy

This skill covers stable hoajs ecosystem patterns rather than duplicating every package README or every external library API. Use this map to choose the right reference and avoid common cross-package mistakes.

For package-specific code changes, do not rely on this skill alone. Inspect the target package before editing:

1. `package.json` for dependencies, peers, scripts, and build style.
2. `src/` for runtime imports and public exports.
3. tests for expected behavior and test-only dependencies.
4. README/docs/examples for public API and install guidance.

The references intentionally summarize high-value invariants: core `ctx` APIs, router installation, middleware vs extension shape, dependency classification, Cloudflare runtime patterns, validation adapters, and public redaction. If a long-tail package needs exact option names or edge behavior, read that package's source/README and preserve its local style.

For official docs freshness checks, use the website-generated `llms.txt` as the index and `llms-full.txt` as the searchable full-text source. In normal packaged-skill use, assume users do not have these files locally; fetch the canonical official docs directly from `https://hoa-js.com/llms.txt` and `https://hoa-js.com/llms-full.txt` when web access is available. Local docs exports are maintainer development inputs, not runtime dependencies of the skill.

## Dependency interpretation

Most official middleware packages declare `hoa` as a peer dependency and also install it as a dev dependency for local tests/builds. Do not treat dev dependencies used in tests as user production install requirements. Use `dependencies.md` for classification rules.

## Reference targeting

- API or architecture → `architecture.md`, `api.md`.
- Route code → `routing.md`.
- Middleware implementation → `middleware.md`.
- Dependency questions → `dependencies.md`.
- Validator packages → `validation.md`.
- Security packages → `security.md`.
- Cloudflare and examples → `cloudflare.md`, `examples.md`.
- Tests/style/docs → `testing.md`, `code-style.md`.
