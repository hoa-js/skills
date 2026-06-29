#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')

const root = process.argv[2] || process.cwd()
const patterns = [
  { re: /\bc\.json\s*\(/, message: 'Hono-style c.json()' },
  { re: /\bc\.text\s*\(/, message: 'Hono-style c.text()' },
  { re: /\bc\.req\b/, message: 'Hono-style c.req' },
  { re: /\bnew\s+Hono\s*\(/, message: 'Hono app constructor' },
  { re: /from ['"]hono['"]/, message: 'hono import' },
  { re: /\bres\.json\s*\(/, message: 'Express-style res.json()' },
  { re: /\(\s*req\s*,\s*res\s*\)\s*=>/, message: 'Express-style (req, res) handler' },
  { re: /function\s+\w*\s*\(\s*req\s*,\s*res\s*\)/, message: 'Express-style function(req, res) handler' }
]
const exts = new Set(['.js', '.ts', '.mjs', '.cjs', '.jsx', '.tsx'])
const ignore = new Set(['node_modules', '.git', 'dist', 'coverage'])
const findings = []
const self = path.resolve(process.argv[1])

function walk (dir) {
  if (!fs.existsSync(dir)) return

  const stat = fs.statSync(dir)
  if (stat.isFile()) {
    if (path.resolve(dir) !== self && exts.has(path.extname(dir))) check(dir)
    return
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignore.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (path.resolve(full) !== self && exts.has(path.extname(entry.name))) check(full)
  }
}

function check (file) {
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)
  lines.forEach((line, i) => {
    for (const p of patterns) {
      if (p.re.test(line)) findings.push({ file, line: i + 1, message: p.message, text: line.trim() })
    }
  })
}

walk(path.resolve(root))

if (findings.length) {
  console.error('Possible Hono/Express API misuse found in source files:')
  for (const f of findings) console.error(`${f.file}:${f.line} ${f.message}: ${f.text}`)
  console.error('Review findings manually; source snippets that are clearly pre-migration input may be acceptable.')
  process.exit(1)
}

console.log('No obvious Hono/Express API misuse found in source files.')
