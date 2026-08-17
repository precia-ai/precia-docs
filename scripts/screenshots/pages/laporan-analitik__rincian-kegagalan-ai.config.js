/**
 * Laporan & Analitik > Rincian Kegagalan AI
 * Route: /analytics/failures
 * Diakses dari kartu "Alasan kegagalan" di dashboard analitik (tombol
 * "Lihat seluruh kegagalan"), atau langsung lewat URL. Perlu permission
 * monitoring/laporan (akun SUP punya).
 */
module.exports = [
  {
    id: 'laporan-analitik__rincian-kegagalan-ai__01-tampilan-awal',
    section: 'laporan-analitik',
    pageSlug: 'rincian-kegagalan-ai',
    stepSlug: '01-tampilan-awal',
    route: '/analytics/failures',
    role: 'SUP',
    annotate: [
      // Kotak: baris filter (rentang tanggal, alasan, unit, modul AI, tombol muat ulang)
      { type: 'box', x: 289, y: 105, width: 1041, height: 140 },
      // Panah: tautan kasus (kolom Kasus) untuk membuka detail transaksi
      { type: 'arrow', from: { x: 1400, y: 500 }, to: { x: 1378, y: 423 } }
    ]
  }
]
