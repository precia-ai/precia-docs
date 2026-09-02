// Creates one PRECIA study order in OpenMRS 3 PROD via the web UI, the way a
// clinician would, and screenshots each step for evidence. Reads
// OMRS_ADMIN_PASSWORD from the environment only, never hardcoded, never
// printed to stdout. Selectors follow precia-user-docs/content/id/integrasi-simrs/openmrs.mdx
// exactly (button labels verified against that doc's own walkthrough).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://openmrs.precia.site';
const SHOTS_DIR = process.env.SHOTS_DIR || '.';
const PASSWORD = process.env.OMRS_ADMIN_PASSWORD;
const PATIENT_QUERY = process.env.PATIENT_QUERY || 'Mary Smith';
const STUDY_NAME = process.env.STUDY_NAME || 'PRECIA AI ECG Left Ventricular Ejection Fraction';
const REF_NUMBER = process.env.REF_NUMBER || `OMRS3-PROD-${Date.now()}`;
if (!PASSWORD) {
  console.error('OMRS_ADMIN_PASSWORD not set in environment');
  process.exit(1);
}
fs.mkdirSync(SHOTS_DIR, { recursive: true });

function findChromiumExecutable() {
  const base = path.join(process.env.HOME, '.cache/ms-playwright');
  const dirs = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d));
  dirs.sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
  for (let i = dirs.length - 1; i >= 0; i -= 1) {
    for (const sub of ['chrome-linux64', 'chrome-linux']) {
      const candidate = path.join(base, dirs[i], sub, 'chrome');
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  throw new Error('no chromium executable found under ' + base);
}

let shotN = 0;
async function shot(page, label) {
  shotN += 1;
  const file = path.join(SHOTS_DIR, `raw-${String(shotN).padStart(2, '0')}-${label}.png`);
  await page.screenshot({ path: file, fullPage: false }).catch((e) => console.error('screenshot failed', e.message));
  console.log('shot:', file);
}

async function dump(page, label) {
  const file = path.join(SHOTS_DIR, `dump-${label}.txt`);
  const text = await page.locator('body').innerText().catch(() => '(no body text)');
  fs.writeFileSync(file, text);
  console.log('dump:', file, `(${text.length} chars)`);
}

async function step(page, label, fn) {
  console.log(`== step: ${label} ==`);
  try {
    await fn();
    await shot(page, label.replace(/\s+/g, '-'));
  } catch (err) {
    console.error(`STEP FAILED: ${label}:`, err.message);
    await shot(page, `FAILED-${label.replace(/\s+/g, '-')}`).catch(() => {});
    await dump(page, `FAILED-${label.replace(/\s+/g, '-')}`).catch(() => {});
    throw err;
  }
}

async function main() {
  const executablePath = findChromiumExecutable();
  console.log('using chromium at', executablePath);
  console.log('reference number for this run:', REF_NUMBER);
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    // 1. username + Continue
    await step(page, '01 login username', async () => {
      let lastErr;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          await page.goto(`${BASE}/openmrs/spa/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          console.log(`goto attempt ${attempt} failed: ${err.message}, retrying`);
          await page.waitForTimeout(3000);
        }
      }
      if (lastErr) throw lastErr;
      const userField = page.locator('input#username, input[name="username"]').first();
      await userField.waitFor({ timeout: 25000 });
      await userField.fill('admin');
    });

    await step(page, '02 continue clicked', async () => {
      await page.locator('button:has-text("Continue")').first().click();
      await page.waitForTimeout(1200);
    });

    // 2. password + Log in
    await step(page, '03 password filled', async () => {
      const passField = page.locator('input#password, input[name="password"], input[type="password"]').first();
      await passField.waitFor({ timeout: 15000 });
      await passField.fill(PASSWORD);
    });

    await step(page, '04 logged in', async () => {
      await page.locator('button:has-text("Log in")').first().click();
      await page.waitForTimeout(3000);
    });

    // 3. location: click Outpatient Clinic, then Confirm
    await step(page, '05 location chosen', async () => {
      const outpatient = page.locator('text=/Outpatient Clinic/i').first();
      await outpatient.waitFor({ timeout: 10000 });
      await outpatient.click();
    });

    await step(page, '06 location confirmed', async () => {
      const confirmBtn = page.locator('button:has-text("Confirm")').first();
      await confirmBtn.click({ timeout: 10000 });
      await page.waitForTimeout(2000);
    });

    // 4-5. patient search
    await step(page, '07 patient search opened', async () => {
      // The header icon renders a moment after location-confirm navigation,
      // so this wait is required, not optional -- skipping it silently falls
      // through to whatever "Search"-labelled input is already on the landing
      // page (e.g. the service-queues local list filter), which is the wrong
      // box entirely.
      const searchIcon = page.locator('header button[aria-label*="Search" i], button[aria-label*="Search" i]').first();
      await searchIcon.waitFor({ timeout: 15000 });
      await searchIcon.click();
      await page.waitForTimeout(1000);
      // Prefer a search box that names "patient"/"identifier" specifically,
      // since the generic word "Search" alone also matches unrelated list
      // filters already present on some landing pages.
      let searchBox = page.locator('input[placeholder*="patient" i], input[placeholder*="identifier" i]').first();
      if (!(await searchBox.isVisible({ timeout: 5000 }).catch(() => false))) {
        searchBox = page.locator('input[placeholder*="Search" i], input[type="search"]').last();
      }
      await searchBox.waitFor({ timeout: 10000 });
      await searchBox.fill(PATIENT_QUERY);
      await page.waitForTimeout(2500);
    });

    await step(page, '08 patient opened', async () => {
      const result = page.locator(`text=${PATIENT_QUERY}`).first();
      await result.waitFor({ timeout: 15000 });
      await result.click();
      await page.waitForTimeout(3000);
    });
    await dump(page, 'patient-chart-landed');

    // Ensure active visit (required to sign an order)
    await step(page, '09 ensure active visit', async () => {
      const hasActiveVisit = await page.locator('text=/Active Visit/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      if (!hasActiveVisit) {
        console.log('no active visit yet, starting one via Actions menu');
        const actions = page.getByText('Actions', { exact: true }).first();
        await actions.click({ timeout: 10000 });
        await page.waitForTimeout(800);
        const addVisit = page.getByText('Add visit', { exact: true }).first();
        await addVisit.click({ timeout: 10000 });
        await page.waitForTimeout(1500);
        // The visit-start form may ask for a visit type first (e.g. "Facility Visit"),
        // then reveals its own "Start visit" submit button.
        const visitTypeOption = page.getByText('Facility Visit', { exact: false }).first();
        if (await visitTypeOption.isVisible({ timeout: 4000 }).catch(() => false)) {
          await visitTypeOption.click();
          await page.waitForTimeout(500);
        }
        const startVisitFormBtn = page.locator('button:has-text("Start visit")').last();
        if (await startVisitFormBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await startVisitFormBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    });

    // 6. Orders in left nav
    await step(page, '10 orders page opened', async () => {
      await page.locator('text=/^Orders$/').first().click({ timeout: 10000 });
      await page.waitForTimeout(1500);
    });

    // 7. Add button top-right of Orders table
    await step(page, '11 add clicked', async () => {
      // Two shapes depending on whether the patient already has orders today:
      // a populated table has an "Add" button top-right; an empty state shows
      // a "Record orders" link instead. Both open the same order basket panel.
      const addBtn = page.getByRole('button', { name: 'Add', exact: true }).first();
      const recordOrders = page.getByText('Record orders', { exact: true }).first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
      } else {
        await recordOrders.waitFor({ timeout: 10000 });
        await recordOrders.click();
      }
      await page.waitForTimeout(1200);
    });

    // 8. Order basket panel -> Add on Lab orders row
    await step(page, '12 lab orders add clicked', async () => {
      const labRow = page.locator('text=/Lab orders/i').first();
      await labRow.waitFor({ timeout: 10000 });
      // The order basket panel always lists "Drug orders" above "Lab orders",
      // each with its own "Add" link on the same row. A div-ancestor filter on
      // "Lab orders" text also matches the whole panel (since it contains that
      // text via a descendant), whose first inner "Add" is then the Drug
      // orders one, not Lab orders'. Index by position instead: Lab orders'
      // Add is always the second "Add" link in the panel.
      const addLinks = page.locator('text=/^Add$/');
      const count = await addLinks.count();
      const labAdd = count >= 2 ? addLinks.nth(1) : addLinks.first();
      await labAdd.click({ timeout: 10000 });
      await page.waitForTimeout(1200);
    });

    // 9. search PRECIA, click "Order form" (never "Add to basket")
    await step(page, '13 precia study searched', async () => {
      const searchBox = page.locator('input[placeholder*="Search for a test type" i], input[placeholder*="Search" i]').first();
      await searchBox.waitFor({ timeout: 10000 });
      await searchBox.fill('PRECIA');
      await page.waitForTimeout(2000);
    });

    await step(page, '14 order form opened', async () => {
      // The search results panel can list several PRECIA studies at once
      // (e.g. LVEF, Mitral, Uroflowmetry). A `div, li` container filtered by
      // hasText: STUDY_NAME also matches the whole results panel, since that
      // outer wrapper's text content contains STUDY_NAME too via the one
      // matching row nested inside it; `.first()` on that then picks the
      // outer wrapper (or an unrelated ancestor), whose own nested search
      // for "Order form" finds nothing, silently falling through to the
      // globally-first "Order form" link -- i.e. always the first study in
      // the list, regardless of STUDY_NAME. Scope by requiring the container
      // to have BOTH an exact-text match for STUDY_NAME AND an "Order form"
      // link as descendants, then take the smallest (last, most deeply
      // nested) such container -- that is the one specific result row, not
      // the panel.
      const heading = page.getByText(STUDY_NAME, { exact: true });
      await heading.first().waitFor({ timeout: 10000 });
      const resultRow = page
        .locator('div')
        .filter({ has: page.getByText(STUDY_NAME, { exact: true }) })
        .filter({ has: page.getByText('Order form', { exact: true }) })
        .last();
      await resultRow.waitFor({ timeout: 10000 });
      await resultRow.getByText('Order form', { exact: true }).first().click();
      await page.waitForTimeout(1500);

      // Hard check: the opened order form must show STUDY_NAME as its own
      // "Test type", not some other PRECIA study. This is the one place a
      // wrong-study selector bug (like the one fixed above) would otherwise
      // sign a real order silently instead of failing the run.
      const testTypeValue = page.getByText(STUDY_NAME, { exact: true }).first();
      const shown = await testTypeValue.isVisible({ timeout: 5000 }).catch(() => false);
      if (!shown) {
        throw new Error(
          `order form opened but its Test type does not show "${STUDY_NAME}" -- wrong study selected, aborting before Save/Sign`
        );
      }
    });

    // 10. fill form
    await step(page, '15 order form filled', async () => {
      const refField = page.locator('input[id*="reference" i], input[name*="reference" i]').first();
      if (await refField.isVisible({ timeout: 5000 }).catch(() => false)) {
        await refField.fill(REF_NUMBER);
      }
      const note = page.locator('textarea').first();
      if (await note.isVisible({ timeout: 3000 }).catch(() => false)) {
        await note.fill('Order dibuat via web UI OpenMRS 3 prod untuk pembuktian arah masuk konektor PRECIA, tanpa campur tangan manual pada sisi PRECIA.');
      }
    });

    await step(page, '16 order saved', async () => {
      await page.locator('button:has-text("Save order")').first().click({ timeout: 10000 });
      await page.waitForTimeout(1500);
    });

    // 11. Sign and close
    await step(page, '17 order signed and closed', async () => {
      const signBtn = page.locator('button:has-text("Sign and close")').first();
      await signBtn.waitFor({ timeout: 10000 });
      await signBtn.click();
      await page.waitForTimeout(2500);
    });

    await step(page, '18 orders table after sign', async () => {
      await page.waitForTimeout(1500);
    });

    await dump(page, 'final-state');
    console.log('FLOW COMPLETE, reference number:', REF_NUMBER);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((err) => {
  console.error('SCRIPT FAILED', err.message);
  process.exit(1);
});
