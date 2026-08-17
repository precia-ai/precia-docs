/**
 * Dashboard > Ringkasan (index)
 * Route: /dashboard
 * Akun SUP (Super Administrator) punya permission monitoring:read_report,
 * jadi yang tampil adalah varian KPI penuh (bukan PersonalPanel).
 */
module.exports = [
  {
    id: 'dashboard__index__01-ringkasan',
    section: 'dashboard',
    pageSlug: 'index',
    stepSlug: '01-ringkasan',
    route: '/dashboard',
    role: 'SUP',
    fullPage: true,
    annotate: [
      // Kotak: tombol pemilih rentang tanggal (7/30/90 hari terakhir)
      { type: 'box', x: 1013, y: 58, width: 400, height: 36 },
      // Panah: item pertama di "Perlu perhatian" bisa diklik ke detail transaksi
      { type: 'arrow', from: { x: 1230, y: 900 }, to: { x: 1130, y: 762 } }
    ]
  }
]
