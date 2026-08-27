#!/usr/bin/env node
/**
 * Executes screenshot specs declared under scripts/screenshots/pages/**\/*.config.js
 * Each spec file exports an array of shot specs (see pages/_example.config.js).
 *
 * Usage:
 *   node run.js                       # run every spec
 *   node run.js --only=kasus-klinis   # run only specs whose id starts with this prefix
 */
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') })

const { login } = require('./lib/auth')
const { setLocale } = require('./lib/locale')
const { annotate } = require('./lib/annotate')

const PAGES_DIR = path.join(__dirname, 'pages')
const OUTPUT_ROOT = path.join(__dirname, '../../public/screenshots')

function loadSpecs(onlyPrefix) {
  const files = fs
    .readdirSync(PAGES_DIR)
    .filter((f) => f.endsWith('.config.js') && !f.startsWith('_'))
  const specs = []
  for (const file of files) {
    const arr = require(path.join(PAGES_DIR, file))
    for (const spec of arr) {
      if (!onlyPrefix || spec.id.startsWith(onlyPrefix)) specs.push(spec)
    }
  }
  return specs
}

async function runSpec(browser, spec) {
  const locales = spec.locales || ['id', 'en']
  for (const locale of locales) {
    const context = await browser.newContext({
      viewport: spec.viewport || { width: 1440, height: 900 }
    })
    const page = await context.newPage()
    await setLocale(page, locale)
    if (spec.role) {
      await login(page, spec.role)
    }
    if (spec.route) {
      await page.goto(spec.route.startsWith('http') ? spec.route : `${process.env.PRECIA_BASE_URL || 'https://app-dev.precia.site'}${spec.route}`, {
        waitUntil: 'domcontentloaded'
      })
    }
    if (typeof spec.preActions === 'function') {
      await spec.preActions(page, { locale })
    }

    const outDir = path.join(OUTPUT_ROOT, locale, spec.section, spec.pageSlug)
    fs.mkdirSync(outDir, { recursive: true })
    const rawPath = path.join(outDir, `${spec.stepSlug}.raw.png`)
    const finalPath = path.join(outDir, `${spec.stepSlug}.png`)

    await page.screenshot({ path: rawPath, fullPage: Boolean(spec.fullPage) })

    const annotations =
      typeof spec.annotate === 'function' ? await spec.annotate({ locale }) : spec.annotate
    await annotate(rawPath, finalPath, annotations || [])
    fs.unlinkSync(rawPath)

    console.log(`✓ ${spec.id} [${locale}] -> ${path.relative(process.cwd(), finalPath)}`)
    await context.close()
  }
}

async function main() {
  const onlyArg = process.argv.find((a) => a.startsWith('--only='))
  const onlyPrefix = onlyArg ? onlyArg.split('=')[1] : null

  const specs = loadSpecs(onlyPrefix)
  if (specs.length === 0) {
    console.error('No specs matched. Check scripts/screenshots/pages/*.config.js')
    process.exit(1)
  }

  const browser = await chromium.launch()
  try {
    for (const spec of specs) {
      try {
        await runSpec(browser, spec)
      } catch (err) {
        console.error(`✗ ${spec.id} failed:`, err.message)
      }
    }
  } finally {
    await browser.close()
  }
}

main()
