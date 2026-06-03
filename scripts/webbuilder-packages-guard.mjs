import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const packagesDir = join(root, 'packages')
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue'])
const bannedPatterns = [
  {
    name: 'app alias import',
    pattern: /(['"`])@\//,
  },
  {
    name: 'wbMessage UI side effect',
    pattern: /\bwbMessage\b/,
  },
  {
    name: 'Element Plus UI side effect API',
    pattern: /\b(?:ElMessage|ElMessageBox|ElNotification|ElLoading)\b/,
  },
]

const violations = []

function walk(dir, visit) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'dist' || entry.name === 'node_modules') {
        continue
      }
      walk(path, visit)
      continue
    }
    if (entry.isFile()) {
      visit(path)
    }
  }
}

function hasSourceExtension(path) {
  for (const ext of sourceExtensions) {
    if (path.endsWith(ext)) {
      return true
    }
  }
  return false
}

function lineNumberFor(contents, index) {
  return contents.slice(0, index).split('\n').length
}

for (const packageName of readdirSync(packagesDir)) {
  const srcDir = join(packagesDir, packageName, 'src')
  try {
    if (!statSync(srcDir).isDirectory()) {
      continue
    }
  } catch {
    continue
  }

  walk(srcDir, (filePath) => {
    const rel = relative(root, filePath)

    if (/\/auto-[^/]*\.d\.ts$/.test(rel)) {
      violations.push(`${rel}: generated auto-*.d.ts must not exist in package src`)
    }

    if (!hasSourceExtension(filePath)) {
      return
    }

    const contents = readFileSync(filePath, 'utf8')
    for (const { name, pattern } of bannedPatterns) {
      const match = pattern.exec(contents)
      if (match) {
        violations.push(`${rel}:${lineNumberFor(contents, match.index)}: ${name}`)
      }
    }
  })
}

if (violations.length > 0) {
  console.error('WebBuilder package boundary guard failed:')
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exit(1)
}

console.log('WebBuilder package boundary guard passed.')
