/**
 * kasus-klinis / mengunggah-berkas
 *
 * Steps 2-6 each create their OWN fresh transaction (via the app's real
 * "New Transaction" flow, Cardiology unit) inside preActions, then drive it
 * to the exact visual state needed for that screenshot. This makes every
 * spec fully self-contained and safe to re-run in any order — nothing
 * depends on a shared transaction's mutable upload/status state surviving
 * between runs (which is NOT safe: id/en share the same underlying data,
 * and re-running the whole file mutates it further every time).
 */
const path = require('node:path')

const CARDIOLOGY_UNIT_ID = 'e6cd3b2a-2515-424c-b218-aebe2173d0db'
const SAMPLE_FILE = path.join(__dirname, '..', 'assets', 'sample-ecg.png')

const TAB_BAR = 'div.flex.border-b.border-border.px-1.overflow-x-auto'
const DROPZONE = 'div[role="button"][tabindex="0"]'
const SLOT_ACTIONS = 'div.flex.flex-wrap.gap-2.pt-1'
const SEARCH_INPUT =
  'input.w-full.rounded-md.border.border-border.bg-background.py-2.pl-9.pr-9'

const TXT = {
  id: { newTx: '+ Transaksi Baru', unit: 'CARD - Cardiology', create: 'Buat Transaksi' },
  en: { newTx: '+ New Transaction', unit: 'CARD - Cardiology', create: 'Create Transaction' }
}

/** Create a fresh Cardiology transaction from the worklist page and land on
 * its detail page. Assumes the page is already on /clinical. */
async function createCardiologyTransaction(page, locale, mrnSuffix) {
  const t = TXT[locale]
  await page.getByRole('button', { name: t.newTx, exact: true }).click()
  await page.waitForTimeout(400)
  await page.locator('select').first().selectOption({ label: t.unit })
  const textInputs = page.locator('input:not([type])')
  await textInputs.nth(0).fill(`DOC-UPLOAD-${mrnSuffix}`)
  await textInputs.nth(1).fill('Dokumentasi Unggah Berkas')
  await page.getByRole('button', { name: t.create, exact: true }).click()
  await page.waitForURL(/\/clinical\/transactions\//, { timeout: 15000 })
  await page.waitForSelector(TAB_BAR, { timeout: 15000 })
}

async function openSlotTab(page) {
  const tabButtons = page.locator(TAB_BAR).locator('button')
  await tabButtons.nth(1).click()
  await page.waitForTimeout(500)
}

async function uploadSampleFile(page) {
  const dropzone = page.locator(DROPZONE).first()
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    dropzone.click()
  ])
  await chooser.setFiles(SAMPLE_FILE)
  await page.waitForTimeout(300)
  const uploadBtn = page
    .locator('div.rounded-lg.border.border-border.bg-card.px-4.py-3')
    .filter({ has: page.locator('button') })
    .first()
    .locator('button')
    .first()
  await uploadBtn.click()
  return { dropzone }
}

module.exports = [
  // 1. Worklist for the Cardiology unit — click a row to open a case.
  // Filtered to one known demo patient so the row is stable and clean
  // (the unit's worklist otherwise fills up with test data from other
  // documentation runs).
  {
    id: 'kasus-klinis__mengunggah-berkas__01-worklist-klik-baris',
    section: 'kasus-klinis',
    pageSlug: 'mengunggah-berkas',
    stepSlug: '01-worklist-klik-baris',
    route: `/clinical?unit=${CARDIOLOGY_UNIT_ID}`,
    role: 'SUP',
    preActions: async (page) => {
      await page.waitForSelector('table tbody tr', { timeout: 15000 })
      await page.locator(SEARCH_INPUT).fill('MRN-001')
      await page.waitForTimeout(2500)
    },
    annotate: [{ type: 'box', x: 305, y: 495, width: 1100, height: 45, rx: 6 }]
  },

  // 2. Case detail opened — point at the AI module tab to click next.
  {
    id: 'kasus-klinis__mengunggah-berkas__02-buka-detail-kasus',
    section: 'kasus-klinis',
    pageSlug: 'mengunggah-berkas',
    stepSlug: '02-buka-detail-kasus',
    route: '/clinical',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await createCardiologyTransaction(page, locale, '02')
    },
    annotate: [{ type: 'box', x: 862, y: 271, width: 174, height: 40, rx: 6 }]
  },

  // 3. AI module tab open, empty dropzone.
  {
    id: 'kasus-klinis__mengunggah-berkas__03-dropzone-kosong',
    section: 'kasus-klinis',
    pageSlug: 'mengunggah-berkas',
    stepSlug: '03-dropzone-kosong',
    route: '/clinical',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await createCardiologyTransaction(page, locale, '03')
      await openSlotTab(page)
    },
    annotate: [{ type: 'box', x: 763, y: 439, width: 627, height: 110, rx: 10 }]
  },

  // 4. Upload in progress — throttle the connection so the progress bar is
  // still mid-way when the screenshot is taken.
  {
    id: 'kasus-klinis__mengunggah-berkas__04-progress-unggah',
    section: 'kasus-klinis',
    pageSlug: 'mengunggah-berkas',
    stepSlug: '04-progress-unggah',
    route: '/clinical',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await createCardiologyTransaction(page, locale, '04')
      await openSlotTab(page)

      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Network.enable')
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 50,
        downloadThroughput: 5_000_000,
        uploadThroughput: 15_000 // slow enough to catch the bar mid-way
      })

      await uploadSampleFile(page)
      await page.waitForTimeout(900)
    },
    annotate: [{ type: 'box', x: 780, y: 605, width: 610, height: 40, rx: 6 }]
  },

  // 5. File finished uploading — highlight the file entry and the
  // "Mark Ready for AI" button.
  {
    id: 'kasus-klinis__mengunggah-berkas__05-berkas-terunggah',
    section: 'kasus-klinis',
    pageSlug: 'mengunggah-berkas',
    stepSlug: '05-berkas-terunggah',
    route: '/clinical',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await createCardiologyTransaction(page, locale, '05')
      await openSlotTab(page)
      const { dropzone } = await uploadSampleFile(page)
      // Once the upload finishes, fetchDetail() marks the slot at its file
      // limit and the whole dropzone block unmounts — wait for that.
      await dropzone.waitFor({ state: 'detached', timeout: 40000 })
      await page.waitForTimeout(500)
      // Scroll the "Mark Ready for AI" button into view — the uploaded
      // file preview is tall enough to push it below the fold otherwise.
      await page.locator(SLOT_ACTIONS).scrollIntoViewIfNeeded()
      await page.waitForTimeout(200)
    },
    annotate: ({ locale }) => [
      { type: 'box', x: 763, y: 441, width: 627, height: 258, rx: 10 },
      { type: 'box', x: 763, y: 726, width: locale === 'id' ? 175 : 148, height: 32, rx: 6 }
    ]
  },

  // 6. After clicking "Mark Ready for AI" — status flips to Ready and
  // "Trigger AI" appears.
  {
    id: 'kasus-klinis__mengunggah-berkas__06-tandai-siap-dianalisis',
    section: 'kasus-klinis',
    pageSlug: 'mengunggah-berkas',
    stepSlug: '06-tandai-siap-dianalisis',
    route: '/clinical',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await createCardiologyTransaction(page, locale, '06')
      await openSlotTab(page)
      const { dropzone } = await uploadSampleFile(page)
      await dropzone.waitFor({ state: 'detached', timeout: 40000 })
      await page.waitForTimeout(500)
      const markReadyBtn = page.locator(SLOT_ACTIONS).locator('button').first()
      await markReadyBtn.click()
      await page.waitForTimeout(1000)
      await page.locator(SLOT_ACTIONS).scrollIntoViewIfNeeded()
      await page.waitForTimeout(200)
    },
    annotate: [
      { type: 'box', x: 763, y: 155, width: 627, height: 95, rx: 10 },
      { type: 'box', x: 763, y: 720, width: 100, height: 34, rx: 6 }
    ]
  }
]
