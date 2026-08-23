/**
 * Alur transaksi GNU Health ke PRECIA (lingkungan dev).
 *
 * Tiga sumber tangkapan layar:
 *   1. Halaman pengaturan Integrasi SIMRS di PRECIA (peran SUP), untuk
 *      menunjukkan tempat adapter dan URL endpoint organisasi diatur.
 *   2. Klien web GNU Health (Tryton sao) pada instansi dev. Spec ini memakai
 *      URL penuh pada `route` dan TIDAK memakai `role`, karena login GNU Health
 *      berbeda dari login PRECIA.
 *   3. Halaman daftar kerja dan detail transaksi PRECIA, memakai kasus contoh
 *      milik lingkungan demo. Instansi PRECIA demo belum memuat konektor
 *      GNU Health, sehingga kasus GNU Health belum dapat ditampilkan di sana.
 *      Batasan ini ditulis apa adanya pada halaman dokumentasi.
 *
 * Kredensial GNU Health dibaca dari env GNUHEALTH_UI_USER dan
 * GNUHEALTH_UI_PASSWORD, tidak pernah ditulis di file ini. Jalankan dengan:
 *   GNUHEALTH_UI_USER=... GNUHEALTH_UI_PASSWORD=... \
 *     npm run shots -- --only=integrasi-simrs__gnu-health__
 *
 * Catatan perilaku sao yang sudah diverifikasi:
 *   - Kotak Login hanya meminta nama pengguna. Kata sandi diminta pada kotak
 *     kedua dengan id #ask-dialog-entry setelah tombol LOGIN ditekan.
 *   - Kolom Database sudah terisi dan tidak perlu disentuh. Mengisinya justru
 *     menggantung karena selector #database cocok ke dua elemen.
 *   - Menu kiri adalah tabel pohon. Baris dibuka dengan klik ganda pada sel
 *     teksnya, bukan pada barisnya, karena klik ganda pada sel relasi akan
 *     membuka record relasi tersebut.
 *   - Kolom Patient, Study dan Health prof adalah many2one dengan pelengkapan
 *     otomatis. Nilai harus dipilih dari daftar saran, bukan sekadar diketik.
 *
 * Langkah 06 dan 07 membuat record baru di layar tetapi TIDAK pernah menyimpan,
 * sehingga tidak menambah data di instansi dev. Langkah 08 dan 11 memakai
 * permintaan yang sudah ada, yaitu Order 007 atas nama Ana Isabel Betz.
 */

const GNUHEALTH_URL = process.env.GNUHEALTH_UI_URL || 'https://gnuhealth-dev.precia.site/'

/** Unit dan transaksi contoh pada organisasi demo PRECIA. */
const PRECIA_UNIT_ID = 'e6cd3b2a-2515-424c-b218-aebe2173d0db'
const PRECIA_TX_ID = 'bd386c68-25d6-4195-9fe9-34d27dd86936'

/** Permintaan pencitraan yang dipakai sebagai contoh pada instansi GNU Health dev. */
const ORDER_NUMBER = '007'
const PATIENT_FRAGMENT = 'Ana Isabel'
const STUDY_FRAGMENT = 'PRECIA AI ECG'

const COMMENT_TEXT = {
  id: 'Permintaan pemeriksaan untuk analisis PRECIA AI.',
  en: 'Imaging request submitted for PRECIA AI analysis.'
}

/**
 * Kotak anotasi yang diukur dari elemen sungguhan saat preActions berjalan.
 * Kunci: "<stepSlug>:<locale>:<nama>". annotationsFor() melempar galat kalau
 * kosong, supaya tangkapan layar tanpa anotasi tidak mungkin diterbitkan.
 */
const measured = {}

function keyOf(step, locale, name) {
  return `${step}:${locale}:${name}`
}

async function measure(page, step, locale, name, locator, padding = 8) {
  const box = await locator.first().boundingBox()
  if (!box) {
    throw new Error(`Tidak dapat mengukur elemen "${name}" pada langkah ${step} (${locale}).`)
  }
  measured[keyOf(step, locale, name)] = {
    type: 'box',
    x: Math.round(box.x - padding),
    y: Math.round(box.y - padding),
    width: Math.round(box.width + padding * 2),
    height: Math.round(box.height + padding * 2)
  }
}

function annotationsFor(step, locale, names) {
  const boxes = names.map((name) => measured[keyOf(step, locale, name)]).filter(Boolean)
  if (boxes.length === 0) {
    throw new Error(`Tidak ada anotasi yang terukur untuk langkah ${step} (${locale}).`)
  }
  return boxes
}

/* ------------------------------------------------------------------ */
/* Bantuan sisi GNU Health                                             */
/* ------------------------------------------------------------------ */

function credentials() {
  const user = process.env.GNUHEALTH_UI_USER
  const password = process.env.GNUHEALTH_UI_PASSWORD
  if (!user || !password) {
    throw new Error(
      'Env GNUHEALTH_UI_USER dan GNUHEALTH_UI_PASSWORD wajib diisi saat menjalankan spec GNU Health.'
    )
  }
  return { user, password }
}

async function waitLoginDialog(page) {
  await page.waitForSelector('#login', { timeout: 45000 })
  await page.waitForTimeout(1500)
}

async function fillUserName(page) {
  await page.fill('#login', credentials().user)
}

async function submitUserName(page) {
  await page.click('.btn:has-text("LOGIN")')
  await page.waitForSelector('#ask-dialog-entry', { timeout: 30000 })
  await page.waitForTimeout(1200)
}

async function submitPassword(page) {
  await page.fill('#ask-dialog-entry', credentials().password)
  await page.keyboard.press('Enter')
  await page.waitForSelector('#menu div.column-char[title="Health"]', { timeout: 45000 })
  await page.waitForTimeout(3000)
}

async function loginGnuhealth(page) {
  await waitLoginDialog(page)
  await fillUserName(page)
  await submitUserName(page)
  await submitPassword(page)
}

function menuCell(page, label) {
  return page.locator(`#menu div.column-char[title="${label}"]`).first()
}

async function expandMenu(page, label) {
  const row = page.locator(`#menu tr:has(div.column-char[title="${label}"])`).first()
  await row.locator('span.expander img').first().click()
  await page.waitForTimeout(2000)
}

async function openImagingTestRequest(page) {
  await expandMenu(page, 'Medical Imaging')
  await menuCell(page, 'Imaging Test Request').dblclick()
  await page.waitForSelector('#tabcontent button[title="New"]', { timeout: 30000 })
  await page.waitForTimeout(3000)
}

async function openOrder(page, order) {
  await page
    .locator('#tabcontent tbody tr td[data-title="Order: "] div.column-char', { hasText: order })
    .first()
    .dblclick()
  await page.waitForSelector('input[name="patient"]', { timeout: 30000 })
  await page.waitForTimeout(3000)
}

async function pickCompletion(page, field, fragment) {
  const input = page.locator(`input[name="${field}"]`).first()
  await input.click()
  await input.fill(fragment)
  await page.waitForTimeout(2500)
  await page.locator(`input[name="${field}"] ~ ul.dropdown-menu li.completion a`).first().click()
  await page.waitForTimeout(1500)
}

/* ------------------------------------------------------------------ */
/* Spec                                                                */
/* ------------------------------------------------------------------ */

const SECTION = 'integrasi-simrs'
const PAGE = 'gnu-health'

module.exports = [
  {
    id: 'integrasi-simrs__gnu-health__01-pengaturan-koneksi',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '01-pengaturan-koneksi',
    route: '/settings/simrs-integration',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await page.waitForSelector('#simrs-adapter', { timeout: 20000 })
      await page.waitForTimeout(1500)
      await measure(page, '01', locale, 'adapter', page.locator('#simrs-adapter'))
      await measure(page, '01', locale, 'endpoint', page.locator('#simrs-endpoint-url'))
    },
    annotate: ({ locale }) => annotationsFor('01', locale, ['adapter', 'endpoint'])
  },
  {
    id: 'integrasi-simrs__gnu-health__02-halaman-masuk',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '02-halaman-masuk',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await waitLoginDialog(page)
      await fillUserName(page)
      await page.waitForTimeout(800)
      await measure(page, '02', locale, 'user', page.locator('#login'))
      await measure(page, '02', locale, 'button', page.locator('.btn:has-text("LOGIN")'))
    },
    annotate: ({ locale }) => annotationsFor('02', locale, ['user', 'button'])
  },
  {
    id: 'integrasi-simrs__gnu-health__03-kata-sandi',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '03-kata-sandi',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await waitLoginDialog(page)
      await fillUserName(page)
      await submitUserName(page)
      await page.fill('#ask-dialog-entry', credentials().password)
      await page.waitForTimeout(800)
      await measure(page, '03', locale, 'entry', page.locator('#ask-dialog-entry'))
    },
    annotate: ({ locale }) => annotationsFor('03', locale, ['entry'])
  },
  {
    id: 'integrasi-simrs__gnu-health__04-menu-pencitraan',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '04-menu-pencitraan',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await loginGnuhealth(page)
      await expandMenu(page, 'Medical Imaging')
      await measure(page, '04', locale, 'medical-imaging', menuCell(page, 'Medical Imaging'))
      await measure(page, '04', locale, 'request', menuCell(page, 'Imaging Test Request'))
    },
    annotate: ({ locale }) => annotationsFor('04', locale, ['medical-imaging', 'request'])
  },
  {
    id: 'integrasi-simrs__gnu-health__05-daftar-permintaan',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '05-daftar-permintaan',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await loginGnuhealth(page)
      await openImagingTestRequest(page)
      await measure(page, '05', locale, 'tabs', page.locator('#tabcontent ul.nav-tabs'))
      await measure(page, '05', locale, 'new', page.locator('#tabcontent button[title="New"]'))
    },
    annotate: ({ locale }) => annotationsFor('05', locale, ['tabs', 'new'])
  },
  {
    id: 'integrasi-simrs__gnu-health__06-formulir-baru',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '06-formulir-baru',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await loginGnuhealth(page)
      await openImagingTestRequest(page)
      await page.click('#tabcontent button[title="New"]')
      await page.waitForSelector('input[name="patient"]', { timeout: 30000 })
      await page.waitForTimeout(2500)
      await measure(page, '06', locale, 'patient', page.locator('input[name="patient"]'))
      await measure(page, '06', locale, 'study', page.locator('input[name="requested_test"]'))
      await measure(page, '06', locale, 'doctor', page.locator('input[name="doctor"]'))
    },
    annotate: ({ locale }) => annotationsFor('06', locale, ['patient', 'study', 'doctor'])
  },
  {
    id: 'integrasi-simrs__gnu-health__07-formulir-terisi',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '07-formulir-terisi',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await loginGnuhealth(page)
      await openImagingTestRequest(page)
      await page.click('#tabcontent button[title="New"]')
      await page.waitForSelector('input[name="patient"]', { timeout: 30000 })
      await page.waitForTimeout(2000)
      await pickCompletion(page, 'patient', PATIENT_FRAGMENT)
      await pickCompletion(page, 'requested_test', STUDY_FRAGMENT)
      await page.locator('textarea[name="comment"]').first().fill(COMMENT_TEXT[locale])
      await page.waitForTimeout(1000)
      await measure(page, '07', locale, 'patient', page.locator('input[name="patient"]'))
      await measure(page, '07', locale, 'study', page.locator('input[name="requested_test"]'))
      await measure(page, '07', locale, 'save', page.locator('#tabcontent button[title="Save"]'))
    },
    annotate: ({ locale }) => annotationsFor('07', locale, ['patient', 'study', 'save'])
  },
  {
    id: 'integrasi-simrs__gnu-health__08-permintaan-tersimpan',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '08-permintaan-tersimpan',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await loginGnuhealth(page)
      await openImagingTestRequest(page)
      await openOrder(page, ORDER_NUMBER)
      await measure(page, '08', locale, 'order', page.locator('input[name="request"]'))
      await measure(page, '08', locale, 'state', page.locator('select[name="state"]'))
    },
    annotate: ({ locale }) => annotationsFor('08', locale, ['order', 'state'])
  },
  {
    id: 'integrasi-simrs__gnu-health__09-daftar-kerja-precia',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '09-daftar-kerja-precia',
    route: `/clinical?unit=${PRECIA_UNIT_ID}`,
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await page.waitForSelector('table tbody tr', { timeout: 25000 })
      await page.waitForTimeout(2500)
      await measure(page, '09', locale, 'unit-filter', page.locator('select').nth(1))
      await measure(page, '09', locale, 'row', page.locator('table tbody tr').first(), 4)
    },
    annotate: ({ locale }) => annotationsFor('09', locale, ['unit-filter', 'row'])
  },
  {
    id: 'integrasi-simrs__gnu-health__10-detail-transaksi-precia',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '10-detail-transaksi-precia',
    route: `/clinical/transactions/${PRECIA_TX_ID}`,
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await page.waitForSelector('h1', { timeout: 25000 })
      await page.waitForTimeout(2500)
      await measure(page, '10', locale, 'code', page.locator('h1').first())
      await measure(
        page,
        '10',
        locale,
        'notes',
        page.locator('p', { hasText: 'Suspected reduced ejection' }).last()
      )
    },
    annotate: ({ locale }) => annotationsFor('10', locale, ['code', 'notes'])
  },
  {
    id: 'integrasi-simrs__gnu-health__11-catatan-hasil-ai',
    section: SECTION,
    pageSlug: PAGE,
    stepSlug: '11-catatan-hasil-ai',
    route: GNUHEALTH_URL,
    preActions: async (page, { locale }) => {
      await loginGnuhealth(page)
      await openImagingTestRequest(page)
      await openOrder(page, ORDER_NUMBER)
      await page.click('#tabcontent button[title^="Note"]')
      await page.waitForSelector('.modal-content', { timeout: 30000 })
      await page.waitForTimeout(3000)
      const modal = page.locator('.modal-content').first()
      await modal.locator('td[data-title="Message: "]').first().dblclick()
      await page.waitForSelector('.modal-content input[name="unread"]', { timeout: 30000 })
      await page.waitForTimeout(2500)
      await measure(page, '11', locale, 'author', modal.locator('input[name="last_user"]'))
      await measure(page, '11', locale, 'message', modal.locator('textarea[name="message"]'), 6)
    },
    annotate: ({ locale }) => annotationsFor('11', locale, ['author', 'message'])
  }
]
