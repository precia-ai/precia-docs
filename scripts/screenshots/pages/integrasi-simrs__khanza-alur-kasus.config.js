/**
 * Screenshots untuk alur kasus SIMRS Khanza ke PRECIA (lingkungan dev).
 *
 * Dua sisi didokumentasikan:
 *   1. Klien operator Khanza (aplikasi Java Swing yang disajikan lewat noVNC).
 *      Route memakai URL penuh, bukan path app-dev, dan spec ini TIDAK memakai
 *      field `role` karena tidak ada login PRECIA di sisi Khanza.
 *   2. Halaman detail transaksi PRECIA yang terbentuk dari kasus tersebut.
 *
 * Prasyarat spec Khanza:
 *   - Sesi X di container klien Khanza berada dalam kondisi BELUM login
 *     (toolbar menampilkan "Log In", tombol Registrasi berwarna abu-abu).
 *     Sesi X bersifat persisten, jadi kondisi awal harus dipastikan manual
 *     sebelum menjalankan generator. Karena itu spec ini hanya dijalankan
 *     untuk satu locale.
 *   - Kredensial operator Khanza dibaca dari env KHANZA_UI_USER dan
 *     KHANZA_UI_PASSWORD, tidak pernah ditulis di file ini.
 *
 * Dua perilaku noVNC yang wajib dipatuhi, keduanya sudah diverifikasi:
 *   - Klik pertama harus mengenai title bar jendela Khanza. Tanpa itu window
 *     manager tidak memberi fokus X ke jendela dan seluruh klik toolbar
 *     berikutnya diabaikan tanpa pesan galat.
 *   - Pengetikan harus per tombol dengan jeda. page.keyboard.type() yang cepat
 *     membuat sebagian karakter hilang di jalur VNC sehingga login ditolak.
 */

const KHANZA_URL = process.env.KHANZA_UI_URL || 'https://khanza-ui-dev.precia.site'
const TX_ROUTE = '/clinical/transactions/17271e9c-cd11-4d55-88e0-b59e9c7f1271'

// Titik klik pada viewport 1440x900. Canvas noVNC menempati y=45..855 dan
// menskalakan layar remote 1600x900 dengan faktor 0.9.
const POINT = {
  titleBar: { x: 700, y: 55 },
  toolbarLogin: { x: 737, y: 106 },
  toolbarRegistrasi: { x: 120, y: 106 },
  fieldIdAdmin: { x: 800, y: 440 },
  fieldPassword: { x: 800, y: 465 },
  buttonLogin: { x: 655, y: 510 },
  fieldPeriodeAwal: { x: 100, y: 734 },
  buttonCari: { x: 777, y: 734 }
}

async function vncClick(page, point, settleMs = 1500) {
  await page.mouse.move(point.x, point.y)
  await page.waitForTimeout(400)
  await page.mouse.down()
  await page.waitForTimeout(250)
  await page.mouse.up()
  await page.waitForTimeout(settleMs)
}

async function vncType(page, text) {
  for (const ch of text) {
    await page.keyboard.press(ch)
    await page.waitForTimeout(200)
  }
}

module.exports = [
  {
    id: 'integrasi-simrs__khanza-alur-kasus__01-registrasi-di-khanza',
    section: 'integrasi-simrs',
    pageSlug: 'khanza-alur-kasus',
    stepSlug: '01-registrasi-di-khanza',
    route: KHANZA_URL,
    locales: ['id'],
    viewport: { width: 1440, height: 900 },
    preActions: async (page) => {
      const user = process.env.KHANZA_UI_USER
      const pass = process.env.KHANZA_UI_PASSWORD
      if (!user || !pass) {
        throw new Error('Set KHANZA_UI_USER dan KHANZA_UI_PASSWORD di .env.local')
      }
      await page.waitForSelector('canvas', { timeout: 30000 })
      await page.waitForTimeout(4000)

      // Beri fokus X ke jendela Khanza sebelum menyentuh toolbar.
      await vncClick(page, POINT.titleBar, 800)
      await vncClick(page, POINT.toolbarLogin, 2500)

      await vncClick(page, POINT.fieldIdAdmin, 500)
      await vncType(page, user)
      await vncClick(page, POINT.fieldPassword, 500)
      await vncType(page, pass)
      await vncClick(page, POINT.buttonLogin, 4000)

      await vncClick(page, POINT.toolbarRegistrasi, 5000)

      // Lebarkan periode supaya registrasi 01-08-2026 ikut tampil.
      await vncClick(page, POINT.fieldPeriodeAwal, 400)
      await page.keyboard.press('Control+a')
      await page.keyboard.press('Delete')
      await page.waitForTimeout(300)
      await vncType(page, '01-08-2026')
      await vncClick(page, POINT.buttonCari, 4000)
    },
    annotate: [
      // Baris hasil registrasi yang akan dikirim ke PRECIA.
      { type: 'box', x: 8, y: 196, width: 1424, height: 22 },
      // Kolom No.Rawat, kunci yang dipakai saat kasus diajukan ke PRECIA.
      { type: 'box', x: 66, y: 196, width: 104, height: 22 },
      { type: 'arrow', from: { x: 300, y: 300 }, to: { x: 140, y: 222 } }
    ]
  },
  {
    id: 'integrasi-simrs__khanza-alur-kasus__02-transaksi-di-precia',
    section: 'integrasi-simrs',
    pageSlug: 'khanza-alur-kasus',
    stepSlug: '02-transaksi-di-precia',
    route: TX_ROUTE,
    role: 'DEMOSAD',
    viewport: { width: 1440, height: 900 },
    preActions: async (page) => {
      await page.waitForTimeout(2500)
    },
    annotate: [
      // Kode transaksi PRECIA, diturunkan dari no_rawat dan kode modul AI.
      { type: 'box', x: 298, y: 114, width: 514, height: 40 },
      // Catatan yang membawa kembali no_rawat, ai_module_code dan sumber_data.
      { type: 'box', x: 298, y: 404, width: 390, height: 68 },
      // Unit tujuan yang dipakai transaksi ini.
      { type: 'box', x: 302, y: 546, width: 200, height: 70 }
    ]
  }
]
