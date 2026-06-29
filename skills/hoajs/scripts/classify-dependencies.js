#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(process.argv[2] || process.cwd())
const pkgPath = path.join(root, 'package.json')
if (!fs.existsSync(pkgPath)) {
  console.error('package.json not found')
  process.exit(1)
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
const declared = new Map()
for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies']) {
  for (const dep of Object.keys(pkg[field] || {})) {
    if (!declared.has(dep)) declared.set(dep, [])
    declared.get(dep).push(field)
  }
}

const imports = new Map()
const ignore = new Set(['node_modules', '.git', 'dist', 'coverage'])
const exts = new Set(['.js', '.ts', '.mjs', '.cjs', '.jsx', '.tsx', '.md', '.mdx'])

function usageKind (rel) {
  const lower = rel.toLowerCase()
  if (lower.startsWith('src/')) return 'src'
  if (lower.startsWith('__test__/') || lower.startsWith('test/') || lower.startsWith('tests/') || lower.includes('.test.') || lower.includes('.spec.')) return 'test'
  if (lower.startsWith('example') || lower.startsWith('examples/')) return 'example'
  if (lower === 'readme.md' || lower.startsWith('docs/')) return 'docs'
  return 'config'
}

function addImport (dep, kind) {
  if (!imports.has(dep)) imports.set(dep, new Set())
  imports.get(dep).add(kind)
}

function packageName (spec) {
  if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('#') || spec.startsWith('node:')) return null
  if (spec.startsWith('@')) return spec.split('/').slice(0, 2).join('/')
  return spec.split('/')[0]
}

function walk (dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignore.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (exts.has(path.extname(entry.name)) || entry.name === 'README.md') check(full)
  }
}

function check (file) {
  const rel = path.relative(root, file).replaceAll('\\', '/')
  const kind = usageKind(rel)
  const text = fs.readFileSync(file, 'utf8')
  const re = /(?:import\s+(?:type\s+)?(?:[^'"]+\s+from\s+)?|export\s+[^'"]*\s+from\s+|import\s*\(|require\s*\()(['"])([^'"]+)\1/g
  let m
  while ((m = re.exec(text))) {
    const dep = packageName(m[2])
    if (dep) addImport(dep, kind)
  }
}

walk(root)

function classify (dep, fields, usage) {
  const has = f => fields.includes(f)
  const used = k => usage.includes(k)
  const notes = []

  if (has('peerDependencies') && has('devDependencies')) {
    return {
      classification: 'peer + dev-for-tests/local',
      notes: used('src')
        ? 'Peer for consuming apps; repo also installs it locally for tests/builds.'
        : 'Peer externally; local install appears to support tests/builds/docs.'
    }
  }

  if (has('peerDependencies')) {
    return {
      classification: 'peer',
      notes: 'Consuming app provides this dependency.'
    }
  }

  if (has('optionalDependencies')) {
    notes.push('Declared in optionalDependencies; verify conditional runtime intent and platform support.')
  }

  if (has('optionalDependencies') && !has('dependencies') && !has('devDependencies')) {
    return {
      classification: used('src') ? 'runtime' : 'unclear',
      notes: used('src')
        ? notes.join(' ')
        : ['Optional dependency not observed in src; confirm whether it is feature-gated, docs-only, or stale.', ...notes].join(' ')
    }
  }

  if (has('dependencies')) {
    if (used('src')) {
      return {
        classification: 'runtime',
        notes: notes.join(' ')
      }
    }

    return {
      classification: 'unclear',
      notes: ['Declared in dependencies but not observed in src; check tests, docs, build scripts, or maintainer intent.', ...notes].join(' ')
    }
  }

  if (has('devDependencies')) {
    if (used('test')) {
      return {
        classification: 'test-only',
        notes: used('config') ? 'Also appears in config/scripts; verify whether any part is build-tooling.' : ''
      }
    }

    if (used('example')) {
      return {
        classification: 'example-only',
        notes: used('config') ? 'Also appears in config/scripts; keep out of user install docs unless runtime code imports it.' : ''
      }
    }

    if (used('docs')) {
      return {
        classification: 'docs-only',
        notes: used('config') ? 'Also appears in config/scripts; keep out of user install docs.' : ''
      }
    }

    return {
      classification: 'dev/build-tool',
      notes: used('src') ? 'Imported from src while declared only as devDependency; verify whether this should become a runtime or peer dependency.' : ''
    }
  }

  if (usage.length) {
    if (!used('src')) {
      if (used('test')) {
        return {
          classification: 'test-only',
          notes: 'Observed in tests but not declared in package.json; verify whether it is provided transitively, intentionally undeclared, or missing from devDependencies.'
        }
      }

      if (used('example')) {
        return {
          classification: 'example-only',
          notes: 'Observed in examples but not declared in package.json; verify whether the example has its own manifest or this dependency should be documented separately.'
        }
      }

      if (used('docs')) {
        return {
          classification: 'docs-only',
          notes: 'Observed only in README/docs but not declared in package.json; treat as documentation/example context, not package runtime dependency.'
        }
      }
    }

    return {
      classification: 'unclear',
      notes: 'Observed import but not declared in package.json; verify whether it is transitive, intentionally undeclared, or missing from the manifest.'
    }
  }

  return {
    classification: 'unclear',
    notes: 'No declaration or import usage found.'
  }
}

console.log('Draft dependency classification. Verify against source, tests, docs, package scripts, and maintainer intent before changing dependencies.')
console.log('')
console.log('| Dependency | Declared in | Observed usage | Classification | Notes |')
console.log('|---|---|---|---|---|')
for (const dep of [...new Set([...declared.keys(), ...imports.keys()])].sort()) {
  const fields = declared.get(dep) || []
  const usage = [...(imports.get(dep) || [])].sort()
  const result = classify(dep, fields, usage)
  console.log(`| \`${dep}\` | ${fields.join(', ') || '-'} | ${usage.join(', ') || '-'} | ${result.classification} | ${result.notes || '-'} |`)
}
