#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')

const roots = process.argv.slice(2)
if (!roots.length) roots.push(process.cwd())

const placeholder = String.raw`<[^>]+>|your-[\w-]+|example\.com|example\.org|example\.net|localhost|127\.0\.0\.1|0\.0\.0\.0`
const safeMatch = new RegExp(`^(?:${placeholder})$`, 'i')
const patterns = [
  { re: /Authorization\s*:\s*(?!<)[^\s`'"}]+/i, message: 'authorization header' },
  { re: /Bearer\s+(?!<)[A-Za-z0-9._~+/-]{16,}/i, message: 'bearer token-like string' },
  { re: /Cookie\s*:\s*(?!<)(?=[^`'"}]*\b(?:session|token|auth|jwt|refresh)\b)[^`'"}]+/i, message: 'cookie credential header' },
  { re: /Set-Cookie\s*:\s*(?!<)(?=[^`'"}]*\b(?:session|token|auth|jwt|refresh)\b)[^`'"}]+/i, message: 'set-cookie credential header' },
  { re: /['"]?(?:api[_-]?key|x-api-key|token|secret|password|session|refresh_token|access_token|auth_token|jwt)['"]?\s*[:=]\s*['"](?!<)[^'"]{12,}['"]/i, message: 'secret-like key/value' },
  { re: /\b(?:sk|pk|rk)_(?:live|test|prod|secret)?[A-Za-z0-9_/-]{12,}/i, message: 'provider key-like string' },
  { re: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, message: 'JWT-like string' },
  { re: /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s)"'`]+/i, message: 'database connection string' },
  { re: /['"]?account_id['"]?\s*[:=]\s*['"](?!<)[a-f0-9]{16,}['"]/i, message: 'non-placeholder Cloudflare account_id' },
  { re: /['"]?(?:namespace_id|database_id|bucket_id|preview_id|id)['"]?\s*[:=]\s*['"](?!<)[a-f0-9]{24,}['"]/i, message: 'non-placeholder id-like hex string' },
  { re: /\b[A-Za-z]:\\(?:Users|work|projects|repo|src|home)\\[^\s`'"<>]+/i, message: 'Windows local path' },
  { re: /\/(?:Users|home)\/[A-Za-z0-9._-]+\/[A-Za-z0-9._~/-]+/, message: 'Unix local user path' },
  { re: /\b\d{1,3}(?:\.\d{1,3}){3}\b/, message: 'IPv4 address' }
]
const exts = new Set(['.md', '.mdx', '.js', '.ts', '.mjs', '.cjs', '.json', '.jsonc', '.yml', '.yaml', '.toml', '.txt', '.env', '.sh', '.html', '.css'])
const exactNames = new Set(['.env', '.env.example'])
const ignore = new Set(['node_modules', '.git', 'dist', 'coverage'])
const findings = []

function isSafePlaceholderFinding (finding) {
  if (!new RegExp(placeholder, 'i').test(finding)) return false

  const withoutPlaceholders = finding.replace(new RegExp(placeholder, 'gi'), '')
  const residualRisk = [
    /\b(?:sk|pk|rk)_(?:live|test|prod|secret)?[A-Za-z0-9_/-]{12,}/i,
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
    /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s)"'`]+/i,
    /[a-f0-9]{24,}/i,
    /\b[A-Za-z]:\\(?:Users|work|projects|repo|src|home)\\[^\s`'"<>]+/i,
    /\/(?:Users|home)\/[A-Za-z0-9._-]+\/[A-Za-z0-9._~/-]+/,
    /\b(?:Bearer\s+)?[A-Za-z0-9._~+/-]{24,}\b/i
  ]

  return !residualRisk.some(re => re.test(withoutPlaceholders))
}

function walk (target) {
  if (!fs.existsSync(target)) return

  const stat = fs.statSync(target)
  if (stat.isFile()) {
    if (shouldCheck(target)) check(target)
    return
  }

  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (ignore.has(entry.name)) continue
    const full = path.join(target, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (shouldCheck(full)) check(full)
  }
}

function shouldCheck (file) {
  const base = path.basename(file)
  return exactNames.has(base) || exts.has(path.extname(base))
}

function check (file) {
  let text
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch {
    return
  }

  const lines = text.split(/\r?\n/)
  lines.forEach((line, i) => {
    for (const p of patterns) {
      if (p.re.test(line) && !isSafePlaceholderFinding(line)) {
        findings.push({ file, line: i + 1, message: p.message, text: line.trim() })
      }
    }
  })
}

for (const root of roots) walk(path.resolve(root))

if (findings.length) {
  console.error('Possible private/sensitive data found:')
  for (const f of findings) console.error(`${f.file}:${f.line} ${f.message}: ${f.text}`)
  console.error('This is an obvious-leak heuristic. Review findings manually and run an additional secret scanner for high-risk releases.')
  process.exit(1)
}

console.log('No obvious private/sensitive data found.')
