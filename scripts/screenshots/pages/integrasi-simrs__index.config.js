/**
 * Halaman pengaturan integrasi SIMRS tingkat organisasi.
 * Route: /settings/simrs-integration
 *
 * Catatan: akun demo SUP yang dipakai untuk semua screenshot sudah punya
 * organisasi ("System Health Organization") dengan pengaturan SIMRS yang
 * tersimpan (adapter Open Hospital). Tidak ada cara di UI untuk berpindah
 * organisasi ke organisasi lain yang belum dikonfigurasi, jadi step 1 di
 * bawah menampilkan kondisi "sudah dikonfigurasi" apa adanya (bukan empty
 * state literal). Step 2 mengganti adapter dan mengisi field endpoint +
 * shared secret dengan nilai contoh di form (TANPA klik Simpan), untuk
 * menunjukkan bagaimana bentuk form saat sedang diisi.
 */
module.exports = [
  {
    id: 'integrasi-simrs__index__01-tampilan-form',
    section: 'integrasi-simrs',
    pageSlug: 'index',
    stepSlug: '01-tampilan-form',
    route: '/settings/simrs-integration',
    role: 'SUP',
    annotate: ({ locale }) =>
      locale === 'en'
        ? [
            { type: 'box', x: 325, y: 292, width: 575, height: 40 },
            { type: 'box', x: 325, y: 398, width: 575, height: 40 }
          ]
        : [
            { type: 'box', x: 325, y: 271, width: 575, height: 40 },
            { type: 'box', x: 325, y: 377, width: 575, height: 40 }
          ]
  },
  {
    id: 'integrasi-simrs__index__02-isi-form',
    section: 'integrasi-simrs',
    pageSlug: 'index',
    stepSlug: '02-isi-form',
    route: '/settings/simrs-integration',
    role: 'SUP',
    preActions: async (page) => {
      await page.waitForSelector('#simrs-adapter', { timeout: 15000 })
      await page.selectOption('#simrs-adapter', 'khanza')
      await page.fill('#simrs-endpoint-url', 'https://klinik-demo.example.org/simrs/callback')
      await page.fill('#simrs-shared-secret', 'contoh-kunci-rahasia-12345')
    },
    annotate: ({ locale }) =>
      locale === 'en'
        ? [
            { type: 'box', x: 325, y: 504, width: 575, height: 40 },
            { type: 'box', x: 665, y: 589, width: 235, height: 40 }
          ]
        : [
            { type: 'box', x: 325, y: 483, width: 575, height: 40 },
            { type: 'box', x: 646, y: 568, width: 254, height: 40 }
          ]
  }
]
