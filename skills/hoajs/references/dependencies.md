# hoajs Dependency Classification

Read this when analyzing, adding, removing, documenting, or explaining dependencies in hoajs multi-repository packages.

## Why this matters

hoajs is a multi-repository ecosystem. Some packages include dependencies only for local tests, README examples, type checking, linting, or build tooling. Do not treat every `package.json` entry as a production runtime dependency.

## Categories

| Category | Meaning | User install docs? |
|---|---|---|
| runtime | Source under `src/` imports it and it is needed when the package runs | Yes |
| peer | The consuming app provides it, e.g. `hoa`, `zod`, `valibot` | Yes, but describe as peer |
| peer + dev-for-tests/local | Peer externally, installed locally for this repo’s tests/build | Mention peer only for users |
| dev/build-tool | Build/lint/test/type/doc tooling | No |
| test-only | Only imported by tests/fixtures | No |
| docs-only | Only mentioned or imported by README/docs | No, except in that docs example |
| example-only | Only used in examples/demo code | No, except in that example |
| transitive | Indirect dependency | No |
| unclear | Declared but usage not confirmed | Mark as needs maintainer confirmation |

## Classification workflow

1. Read `package.json`.
2. Check `dependencies`, `peerDependencies`, `optionalDependencies`, and `devDependencies`.
3. Search `src/**/*` imports.
4. Search tests: `__test__`, `test`, `tests`, `*.test.*`, `*.spec.*`.
5. Search examples and README/docs imports.
6. Search config and scripts for CLI/tool usage.
7. Classify each dependency.
8. For unclear items, do not remove or move automatically.

## Common hoajs patterns

The following patterns recur across hoajs packages and should guide dependency classification before changing install docs or package manifests.

### Companion dependencies

Some important libraries are not `@hoajs/*` packages, but they are part of the hoajs package ecosystem through runtime, peer, or example usage. Do not treat them as hoajs packages, and do not copy their full external API into generated docs. Classify and document them only when the target package actually uses them.

| Dependency | Common hoajs package/context | Usual classification | Guidance |
|---|---|---|---|
| `nana` | `@hoajs/nana`, validation examples | runtime for `@hoajs/nana`; app import when writing schemas | Use existing schemas or public Nana docs/source for exact helpers; do not invent complex schema APIs. |
| `zod` | `@hoajs/zod` | peer for user app, dev dependency for adapter repo | Tell users to install/provide `zod` when using `@hoajs/zod`; do not describe it as bundled. |
| `valibot` | `@hoajs/valibot` | peer for user app, dev dependency for adapter repo | Same peer handling as `zod`; keep existing project validator choice. |
| `jose` | `@hoajs/jwt` | runtime dependency of JWT middleware | Do not ask app users to install it separately unless the target package docs require direct use. |
| `toucan-js` | `@hoajs/sentry` | peer/runtime depends on target package declaration | Never show real DSNs; inspect package README/source before documenting setup. |
| `mustache` | `@hoajs/mustache` | runtime dependency | Inspect renderer API before generating template examples. |
| `formidable` | `@hoajs/formidable` | runtime dependency | Node-oriented form/file handling; verify runtime before recommending for Workers. |
| `path-to-regexp` | `@hoajs/router` | runtime dependency | Internal router implementation detail; users normally install `@hoajs/router`, not this directly. |
| `qs-esm` | `@hoajs/bodyparser` | runtime dependency | Internal parser dependency; users normally install `@hoajs/bodyparser`, not this directly. |
| `@whatwg-node/server` | `@hoajs/adapter` | runtime dependency | Adapter implementation detail for Node server support. |
| `cloudflare-kv-rate-limit` | `@hoajs/cloudflare-rate-limit` | runtime dependency | Cloudflare KV-specific; require KV binding examples to use placeholders. |

When a companion dependency appears only in tests, docs, or examples, follow the normal `test-only` / `docs-only` / `example-only` rules instead of promoting it to user production install guidance.

### `hoa`

Most middleware packages declare `hoa` as a peer dependency and also install it in dev dependencies.

Interpretation:

- Users need `hoa` in their app.
- The package repo needs `hoa` locally for tests/builds.
- Do not call this a bundled runtime dependency unless it is in `dependencies`.

### Router deps in middleware repos

Some middleware repos use `@hoajs/router` or `@hoajs/tiny-router` only in tests to create a test app.

Interpretation:

- Usually test-only.
- Do not add to user installation docs unless the middleware actually requires routing at runtime.

### Validator adapters

`@hoajs/zod` and `@hoajs/valibot` expect the consuming app to provide the validator library.

Interpretation:

- `zod` / `valibot` are peer dependencies.
- They may also be dev dependencies for local tests/builds.

### Optional dependencies

Some packages may use `optionalDependencies` for conditional runtime integrations or platform-specific features.

Interpretation:

- Do not automatically promote optional entries to ordinary runtime install docs without checking whether the feature is actually required.
- If optional code paths are imported from `src/`, describe them as runtime behavior with an explicit note that the package manifest marks them optional.
- If usage is not confirmed, classify as `unclear` and ask for maintainer confirmation before moving or deleting anything.

### Tooling

Common dev/build tools:

- `eslint`
- `neostandard`
- `jest`
- `ts-jest`
- `ts-node`
- `typescript`
- `tsdown`
- `husky`
- `@commitlint/*`
- `globals`
- `@types/*`

Do not include these in runtime install instructions.

## Output format

When asked to report dependencies, use:

```md
| Dependency | Declared in | Observed usage | Classification | Notes |
|---|---|---|---|---|
| `hoa` | peerDependencies / devDependencies | src/test | peer + dev-for-tests/local | User installs as peer; repo installs locally for tests. |
```

## Adding dependencies

Before adding a dependency, decide:

- Does `src/` import it at runtime? → `dependencies`.
- Is it an adapter/plugin library the user provides? → `peerDependencies` plus dev dependency for tests.
- Is it only for tests? → `devDependencies`.
- Is it only for README/examples? → keep out of package unless examples are part of the package.

## Removing dependencies

Do not remove dependencies solely because they look unused from a shallow scan. First check:

- build config,
- type generation,
- tests,
- docs generation,
- examples,
- package scripts,
- peer dependency intent.

If still unclear, report “needs maintainer confirmation”. The bundled `classify-dependencies.js` script can produce a draft table using the same published taxonomy as this file. It may add important nuance in the `Notes` column for optional dependencies, declared-but-unconfirmed runtime entries, or observed-but-undeclared imports. Verify its output against source files, tests, README/docs, package scripts, and maintainer intent before changing dependencies.

## Dependency mistakes to avoid

For full anti-patterns and corrected examples, read `anti-patterns.md`.

- Do not infer runtime dependencies from tests alone.
- Do not delete or move unclear dependencies without maintainer confirmation.
- Do not document dev/build tools as user install requirements.
- Do not treat peer dependencies as bundled runtime dependencies.
