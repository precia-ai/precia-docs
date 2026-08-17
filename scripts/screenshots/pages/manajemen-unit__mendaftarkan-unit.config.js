/**
 * Manajemen Unit > Mendaftarkan Unit Baru
 * Route: /units/register
 * Wizard 3 langkah: Identity (kode, nama, jenis layanan), Status (awal),
 * Review (konfirmasi sebelum submit).
 */

const UNIT_NAME = 'Unit Contoh Dokumentasi'
const SERVICE_TYPE = 'Layanan Dokumentasi'

// Kode unit disuffix per locale supaya run ID dan EN tidak bentrok kode unik
// (setiap locale bikin unit sungguhan lewat submit di langkah terakhir).
function unitCodeFor(locale) {
  return `UNIT-DOC-DEMO-${(locale || 'id').toUpperCase()}`
}

async function fillIdentity(page, locale) {
  const inputs = page.locator('input')
  await inputs.nth(0).fill(unitCodeFor(locale))
  await inputs.nth(1).fill(UNIT_NAME)
  await inputs.nth(2).fill(SERVICE_TYPE)
}

async function goNext(page) {
  // Scope to <main> - the sidebar's language switcher (ID/EN) also uses
  // aria-pressed buttons and would otherwise collide with page-wide selectors.
  await page.locator('main button:has(svg.lucide-arrow-right)').click()
  await page.waitForTimeout(300)
}

async function selectStatus(page, index) {
  // Scope to <main> for the same reason as goNext above.
  const statusButtons = page.locator('main button[aria-pressed]')
  await statusButtons.nth(index).click()
  await page.waitForTimeout(200)
}

module.exports = [
  {
    id: 'manajemen-unit__mendaftarkan-unit__01-langkah-identitas',
    section: 'manajemen-unit',
    pageSlug: 'mendaftarkan-unit',
    stepSlug: '01-langkah-identitas',
    route: '/units/register',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await fillIdentity(page, locale)
    },
    annotate: [
      // Kotak: field Kode Unit
      { type: 'box', x: 304, y: 296, width: 360, height: 40 },
      // Kotak: field Nama Unit
      { type: 'box', x: 680, y: 296, width: 360, height: 40 },
      // Panah: tombol Lanjut ke langkah berikutnya
      { type: 'arrow', from: { x: 850, y: 500 }, to: { x: 985, y: 552 } }
    ]
  },
  {
    id: 'manajemen-unit__mendaftarkan-unit__02-langkah-status',
    section: 'manajemen-unit',
    pageSlug: 'mendaftarkan-unit',
    stepSlug: '02-langkah-status',
    route: '/units/register',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await fillIdentity(page, locale)
      await goNext(page)
      // pilih opsi status kedua (Pilot)
      await selectStatus(page, 1)
    },
    annotate: [
      // Kotak: opsi status Pilot yang sudah dipilih
      { type: 'box', x: 555, y: 277, width: 234, height: 63 }
    ]
  },
  {
    id: 'manajemen-unit__mendaftarkan-unit__03-langkah-review',
    section: 'manajemen-unit',
    pageSlug: 'mendaftarkan-unit',
    stepSlug: '03-langkah-review',
    route: '/units/register',
    role: 'SUP',
    preActions: async (page, { locale }) => {
      await fillIdentity(page, locale)
      await goNext(page)
      await selectStatus(page, 1)
      await goNext(page)
    },
    annotate: [
      // Kotak: ringkasan unit (nama + kode) yang akan didaftarkan
      { type: 'box', x: 304, y: 293, width: 336, height: 58 },
      // Kotak: status awal yang dipilih (badge Pilot)
      { type: 'box', x: 304, y: 466, width: 336, height: 36 },
      // Panah: tombol Daftarkan Unit (submit, aksi tidak bisa dibatalkan)
      { type: 'arrow', from: { x: 800, y: 500 }, to: { x: 960, y: 600 } }
    ]
  },
  {
    id: 'manajemen-unit__mendaftarkan-unit__04-hasil-akhir',
    section: 'manajemen-unit',
    pageSlug: 'mendaftarkan-unit',
    stepSlug: '04-hasil-akhir',
    route: '/units/register',
    role: 'SUP',
    fullPage: true,
    preActions: async (page, { locale }) => {
      await fillIdentity(page, locale)
      await goNext(page)
      await selectStatus(page, 1)
      await goNext(page)
      await page.locator('main button:has(svg.lucide-plus)').click()
      // Idempotent: kalau unit dengan kode ini sudah pernah dibuat di run
      // sebelumnya, submit akan gagal 409 dan tetap di /units/register --
      // dalam kasus itu langsung navigasi ke daftar unit yang sudah ada.
      try {
        await page.waitForURL((url) => url.pathname === '/units', { timeout: 8000 })
      } catch {
        await page.goto(`${process.env.PRECIA_BASE_URL || 'https://app-dev.precia.site'}/units`, {
          waitUntil: 'networkidle'
        })
      }
      await page.fill('input[type="search"]', unitCodeFor(locale))
      await page.waitForTimeout(400)
    },
    annotate: [
      // Kotak: kartu unit baru yang berhasil terdaftar (muncul di daftar unit)
      { type: 'box', x: 300, y: 332, width: 350, height: 168 }
    ]
  }
]
