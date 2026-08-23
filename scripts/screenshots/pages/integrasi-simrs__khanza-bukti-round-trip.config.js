/**
 * Bukti round trip Khanza ke PRECIA di lingkungan dev, kasus 2026/07/29/000001.
 *
 * Kasus ini dibuktikan ulang dari awal pada 22 Agustus 2026 dan menghasilkan
 * transaksi PRECIA e8d7ffe3-3423-4901-83fb-a61ae0e4a508.
 *
 * SISI KHANZA TIDAK DIOTOMATISASI DI SINI, DAN INI DISENGAJA.
 * Percobaan mengemudikan klien Java Swing Khanza lewat noVNC pada tanggal yang
 * sama menunjukkan dialog Log In tidak dapat dibuka secara andal oleh klik
 * sintetis. Dialog itu terbuka pada percobaan pertama, lalu berhenti terbuka
 * pada percobaan berikutnya, termasuk setelah kontainer klien dimulai ulang,
 * baik melalui tombol toolbar maupun melalui menu Program. Klik sintetis
 * lainnya tetap sampai ke aplikasi, terbukti menu Program masih terbuka, jadi
 * masalahnya khusus pada dialog Log In. Karena itu tangkapan layar sisi Khanza
 * harus disiapkan oleh operator manusia, bukan oleh generator ini.
 *
 * Dialog pencarian berikon penjepit kertas pada form Registrasi juga tidak
 * merespons klik sintetis sama sekali, sehingga pembuatan registrasi baru dari
 * generator tidak mungkin dilakukan. Kolom nama dokter dan nama unit bersifat
 * hanya baca dan hanya dapat diisi lewat dialog pencarian tersebut.
 */

const TX_ROUTE = '/clinical/transactions/e8d7ffe3-3423-4901-83fb-a61ae0e4a508'

module.exports = [
  {
    id: 'integrasi-simrs__khanza-bukti-round-trip__02-transaksi-di-precia',
    section: 'integrasi-simrs',
    pageSlug: 'khanza-bukti-round-trip',
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
      // Unit tujuan transaksi.
      { type: 'box', x: 302, y: 546, width: 200, height: 70 }
    ]
  }
]
