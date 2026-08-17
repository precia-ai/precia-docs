/**
 * Evaluasi & Adopsi > Membuat Siklus Evaluasi
 * Route: /evaluation/new
 *
 * Form satu halaman: kartu "New evaluation cycle" (judul, objektif, trigger,
 * periode), kartu "Scope" (unit klinis, modul AI, indikator - semua checkbox),
 * lalu kartu "Resolved targets" (preview read-only, dihitung dari standing
 * target yang match indikator terpilih).
 *
 * PENTING: halaman evaluasi ini TIDAK tetap Inggris di locale id - label
 * field ikut diterjemahkan (Title -> Judul, dst) sehingga id atribut input
 * (diturunkan dari teks label di komponen Input) ikut berubah per locale.
 * Karena itu field teks diambil by position (bukan by #id), dan checkbox
 * diambil per <fieldset> (unit klinis, modul AI, indikator = 3 fieldset
 * berurutan di kartu Scope) bukan by index absolut, supaya tidak rapuh
 * kalau jumlah unit/modul/standing target di org demo berubah.
 *
 * Prasyarat data: minimal satu standing target aktif harus ada supaya
 * checkbox Indicators tidak kosong dan tabel Resolved targets punya isi.
 * Standing target dibuat lewat UI /evaluation/targets (New target), bukan
 * lewat migrasi/insert database.
 */

async function fillTopCard(page) {
  // Input teks di kartu atas (Title, Trigger reason) tidak punya type attr,
  // beda dengan input[type=date] dan input[type=checkbox] di kartu Scope.
  const textInputs = page.locator(
    'main form input:not([type="date"]):not([type="checkbox"])'
  )
  await textInputs.nth(0).fill('Q3 AI Performance Review') // Title
  await page
    .locator('main form textarea')
    .fill('Check whether adoption and reliability targets are on track before Q4 planning.')
  await textInputs.nth(1).fill('Scheduled quarterly check-in') // Trigger reason
}

async function fillScope(page) {
  const fieldsets = page.locator('main form fieldset')
  const unitChecks = fieldsets.nth(0).locator('input[type="checkbox"]')
  const moduleChecks = fieldsets.nth(1).locator('input[type="checkbox"]')
  const indicatorChecks = fieldsets.nth(2).locator('input[type="checkbox"]')

  // Satu unit klinis dan satu modul AI, sekadar contoh cakupan sempit.
  await unitChecks.nth(0).check()
  await moduleChecks.nth(0).check()

  // Dua indikator (pertama dan terakhir dari standing target aktif yang
  // ada) supaya tabel Resolved targets di bawah menampilkan 2 baris.
  const indicatorCount = await indicatorChecks.count()
  await indicatorChecks.nth(0).check()
  if (indicatorCount > 1) {
    await indicatorChecks.nth(indicatorCount - 1).check()
  }
  await page.waitForTimeout(300)
}

module.exports = [
  {
    id: 'evaluasi-adopsi__membuat-siklus__01-form-kosong',
    section: 'evaluasi-adopsi',
    pageSlug: 'membuat-siklus',
    stepSlug: '01-form-kosong',
    route: '/evaluation/new',
    role: 'SUP',
    fullPage: true,
    annotate: [
      // Kotak: field Title (wajib diisi)
      { type: 'box', x: 304, y: 178, width: 1086, height: 38 },
      // Kotak: field Period start
      { type: 'box', x: 304, y: 478, width: 534, height: 40 },
      // Kotak: field Period end
      { type: 'box', x: 855, y: 478, width: 535, height: 40 }
    ]
  },
  {
    id: 'evaluasi-adopsi__membuat-siklus__02-cakupan-dan-indikator',
    section: 'evaluasi-adopsi',
    pageSlug: 'membuat-siklus',
    stepSlug: '02-cakupan-dan-indikator',
    route: '/evaluation/new',
    role: 'SUP',
    fullPage: true,
    preActions: async (page) => {
      await fillTopCard(page)
      await fillScope(page)
    },
    annotate: [
      // Kotak: satu unit klinis dicentang (opsional, kosongkan = semua unit)
      { type: 'box', x: 304, y: 658, width: 124, height: 36 },
      // Kotak: satu modul AI dicentang (opsional, kosongkan = semua modul)
      { type: 'box', x: 304, y: 823, width: 270, height: 36 },
      // Kotak: indikator dicentang (wajib minimal satu) - lebar dilebihkan
      // supaya tetap menutupi semua checkbox indikator meski jumlah standing
      // target di org demo bertambah/berkurang
      { type: 'box', x: 300, y: 964, width: 200, height: 32 },
      // Kotak: tabel Resolved targets terisi sesuai indikator terpilih
      { type: 'box', x: 304, y: 1120, width: 1084, height: 120 },
      // Panah: tombol Create cycle
      { type: 'arrow', from: { x: 950, y: 1255 }, to: { x: 1310, y: 1285 } }
    ]
  }
]
