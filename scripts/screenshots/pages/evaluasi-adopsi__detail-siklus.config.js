/**
 * Evaluasi & Adopsi > Detail Siklus Evaluasi
 * Route: /evaluation/:cycleId
 *
 * Header siklus (judul, status, badge trigger, periode, tombol Close cycle)
 * + 4 tab: Overview (metrik live + gap per unit/modul), Review (management
 * review + operational context request/response), Follow-ups (action plans,
 * change programs, capacity plans), Artifacts (upload/daftar lampiran).
 * Ditutup dengan dialog "Close evaluation cycle" (dibuka saja, TIDAK submit -
 * closing bersifat permanen dan mengunci semua tab jadi read-only).
 *
 * Menggunakan siklus demo "Q4 2026 adoption review" yang dibuat khusus untuk
 * dokumentasi ini (title unik, gampang dikenali). Diisi lewat UI: 1 management
 * review, 1 context note request+response, 1 action plan (owner+due date).
 *
 * CATATAN BUG APLIKASI (bukan kesalahan data, jangan direplikasi):
 * - Change programs: menampilkan satu change program APA PUN membuat tab
 *   Follow-ups crash (frontend baca `target_unit_ids`, API balikin
 *   `target_units` -> TypeError render). Karena itu section Change programs
 *   di screenshot ini SENGAJA dibiarkan kosong ("No change program recorded
 *   yet"), jangan tambah data lewat form itu sampai bug ini diperbaiki tim FE.
 * - Capacity plans: submit SELALU gagal "API Error: 400" (backend menolak
 *   field signal_metrics bertipe string, minta dictionary). Section ini juga
 *   dibiarkan kosong ("No capacity plan recorded yet") karena tidak ada cara
 *   membuat capacity plan lewat UI saat ini.
 * - Artifacts: badge status selalu "Unconfirmed" dan ukuran file selalu
 *   "NaN MB" walau upload backend-nya sukses (upload_status "stored") -
 *   frontend baca field `is_confirmed`/`size_bytes` yang tidak ada di respons
 *   list API (API pakai `upload_status`/`file_size`). Tombol Download karena
 *   itu selalu nonaktif. Ini state asli yang akan dilihat user, dokumentasi
 *   menuliskan apa adanya.
 *
 * UI halaman ini TIDAK diterjemahkan (tetap Inggris) sesuai instruksi tugas -
 * hanya locale 'en' yang di-generate, lalu disalin manual ke folder id/ supaya
 * kedua versi dokumen (id & en) punya gambar yang valid.
 */
const DEMO_CYCLE_ID = 'fc1dd842-7af5-4e74-ace2-d5ecaf518e1b'
const CYCLE_ROUTE = `/evaluation/${DEMO_CYCLE_ID}`

async function clickTab(page, index) {
  await page.locator('main .border-b.border-border button').nth(index).click()
  await page.waitForTimeout(500)
}

module.exports = [
  {
    id: 'evaluasi-adopsi__detail-siklus__01-overview',
    section: 'evaluasi-adopsi',
    pageSlug: 'detail-siklus',
    stepSlug: '01-overview',
    route: CYCLE_ROUTE,
    role: 'SUP',
    locales: ['en'],
    fullPage: true,
    preActions: async (page) => {
      // Overview adalah tab default, tunggu ekstra supaya chart module
      // utilization dan tabel gap selesai render (data live, dihitung ulang
      // tiap load).
      await page.waitForTimeout(1200)
    },
    annotate: [
      // Kotak: tombol Close cycle (header)
      { type: 'box', x: 1265, y: 80, width: 126, height: 44 },
      // Kotak: kartu Unit adoption + Validator adoption
      { type: 'box', x: 288, y: 428, width: 1120, height: 148 }
    ]
  },
  {
    id: 'evaluasi-adopsi__detail-siklus__02-review',
    section: 'evaluasi-adopsi',
    pageSlug: 'detail-siklus',
    stepSlug: '02-review',
    route: CYCLE_ROUTE,
    role: 'SUP',
    locales: ['en'],
    fullPage: true,
    preActions: async (page) => {
      await clickTab(page, 1)
    },
    annotate: [
      // Kotak: tab Review aktif
      { type: 'box', x: 374, y: 291, width: 110, height: 27 },
      // Kotak: tombol Record review
      { type: 'box', x: 1260, y: 350, width: 147, height: 33 },
      // Kotak: tombol Ask for context (mulai thread pertanyaan konteks)
      { type: 'box', x: 1112, y: 580, width: 157, height: 37 }
    ]
  },
  {
    id: 'evaluasi-adopsi__detail-siklus__03-follow-ups',
    section: 'evaluasi-adopsi',
    pageSlug: 'detail-siklus',
    stepSlug: '03-follow-ups',
    route: CYCLE_ROUTE,
    role: 'SUP',
    locales: ['en'],
    fullPage: true,
    preActions: async (page) => {
      await clickTab(page, 2)
    },
    annotate: [
      // Kotak: tab Follow-ups aktif
      { type: 'box', x: 474, y: 291, width: 108, height: 27 },
      // Kotak: tombol New action plan
      { type: 'box', x: 1248, y: 354, width: 158, height: 33 },
      // Kotak: baris action plan yang sudah dibuat (kolom Owner + Due wajib
      // diisi, syarat supaya siklus bisa ditutup nanti)
      { type: 'box', x: 806, y: 460, width: 380, height: 30 }
    ]
  },
  {
    id: 'evaluasi-adopsi__detail-siklus__04-artifacts',
    section: 'evaluasi-adopsi',
    pageSlug: 'detail-siklus',
    stepSlug: '04-artifacts',
    route: CYCLE_ROUTE,
    role: 'SUP',
    locales: ['en'],
    fullPage: true,
    preActions: async (page) => {
      await clickTab(page, 3)
    },
    annotate: [
      // Kotak: tab Artifacts aktif
      { type: 'box', x: 582, y: 291, width: 87, height: 27 },
      // Kotak: tombol Upload artifact
      { type: 'box', x: 1254, y: 354, width: 155, height: 33 }
    ]
  },
  {
    id: 'evaluasi-adopsi__detail-siklus__05-close-cycle-dialog',
    section: 'evaluasi-adopsi',
    pageSlug: 'detail-siklus',
    stepSlug: '05-close-cycle-dialog',
    route: CYCLE_ROUTE,
    role: 'SUP',
    locales: ['en'],
    fullPage: true,
    preActions: async (page) => {
      await page.waitForTimeout(800)
      await page.locator('main button').first().click()
      await page.waitForTimeout(500)
    },
    annotate: [
      // Kotak: textarea Closing note
      { type: 'box', x: 480, y: 427, width: 476, height: 91 },
      // Kotak: tombol Close cycle (submit, aksi permanen)
      { type: 'box', x: 831, y: 560, width: 125, height: 30 }
    ]
  }
]
