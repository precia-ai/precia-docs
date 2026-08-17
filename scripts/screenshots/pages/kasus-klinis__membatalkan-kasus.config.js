/**
 * Kasus Klinis > Membatalkan Kasus
 * Route: /clinical (unit dipilih via query "?unit=general" supaya langsung ke
 * daftar kerja transaksi, bukan layar "Pilih Unit").
 *
 * Alur pembatalan ada di halaman detail transaksi (bukan modal terpisah):
 * kartu "Batalkan Transaksi" di tab "Info Pasien", berisi textarea alasan
 * (wajib diisi) + tombol merah "Batalkan Transaksi". Tombol nonaktif kalau
 * status transaksi bukan draft/unprocessed/invalid_data/upload_failed.
 *
 * Supaya tidak mengganggu data demo org yang sudah ada, tiap step membuat
 * transaksi baru sendiri lewat UI (unit pertama di dropdown + MRN unik
 * berbasis timestamp), lalu langsung dipakai/dibatalkan di step itu juga.
 * Setiap shot spec berjalan di context/browser terpisah, jadi tidak saling
 * mengganggu satu sama lain maupun data asli org DEMO.
 */

const NEW_TX_BUTTON = '[class*="border-primary/15"] button'
const DIALOG_TEXT_INPUTS =
  '[role="dialog"] input[type="text"], [role="dialog"] input:not([type])'
const DIALOG_SUBMIT = '[role="dialog"] button[type="submit"]'
// Tombol "Batalkan Transaksi" adalah button pertama setelah textarea
// #cancel-reason di urutan DOM — locale-independent, tidak bergantung teks.
const CANCEL_BUTTON_XPATH = 'xpath=following::button[1]'

async function createDemoTransaction(page, mrnPrefix) {
  const mrn = `${mrnPrefix}-${Date.now()}`
  await page.locator(NEW_TX_BUTTON).click()
  await page.waitForSelector('#unit-select')
  await page.selectOption('#unit-select', { index: 1 })
  const inputs = page.locator(DIALOG_TEXT_INPUTS)
  await inputs.nth(0).fill(mrn)
  await inputs.nth(1).fill('Pasien Uji Pembatalan')
  await page.locator(DIALOG_SUBMIT).click()
  await page.waitForURL((url) => /\/clinical\/transactions\/[^/]+$/.test(url.pathname), {
    timeout: 15000
  })
  await page.waitForSelector('#cancel-reason')
}

module.exports = [
  {
    id: 'kasus-klinis__membatalkan-kasus__01-tombol-batalkan',
    section: 'kasus-klinis',
    pageSlug: 'membatalkan-kasus',
    stepSlug: '01-tombol-batalkan',
    route: '/clinical?unit=general',
    role: 'SUP',
    viewport: { width: 1440, height: 1500 },
    preActions: async (page) => {
      await createDemoTransaction(page, 'DEMO-CANCEL-STEP1')
    },
    annotate: [{ type: 'box', x: 760, y: 1015, width: 632, height: 205 }]
  },
  {
    id: 'kasus-klinis__membatalkan-kasus__02-isi-alasan',
    section: 'kasus-klinis',
    pageSlug: 'membatalkan-kasus',
    stepSlug: '02-isi-alasan',
    route: '/clinical?unit=general',
    role: 'SUP',
    viewport: { width: 1440, height: 1500 },
    preActions: async (page) => {
      await createDemoTransaction(page, 'DEMO-CANCEL-STEP2')
      await page.fill(
        '#cancel-reason',
        'Data pasien salah input, dibuat ulang dengan MRN yang benar.'
      )
    },
    annotate: [
      { type: 'box', x: 775, y: 1098, width: 610, height: 68 },
      { type: 'box', x: 775, y: 1185, width: 170, height: 35 }
    ]
  },
  {
    id: 'kasus-klinis__membatalkan-kasus__03-hasil-dibatalkan',
    section: 'kasus-klinis',
    pageSlug: 'membatalkan-kasus',
    stepSlug: '03-hasil-dibatalkan',
    route: '/clinical?unit=general',
    role: 'SUP',
    viewport: { width: 1440, height: 1500 },
    preActions: async (page) => {
      await createDemoTransaction(page, 'DEMO-CANCEL-STEP3')
      await page.fill(
        '#cancel-reason',
        'Data pasien salah input, dibuat ulang dengan MRN yang benar.'
      )
      await page.locator('#cancel-reason').locator(CANCEL_BUTTON_XPATH).click()
      await page.waitForTimeout(1200)
    },
    annotate: [
      { type: 'box', x: 285, y: 260, width: 1110, height: 50 },
      { type: 'box', x: 1035, y: 1043, width: 355, height: 25 }
    ]
  }
]
