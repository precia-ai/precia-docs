/**
 * "Riwayat Perubahan Kasus" (kasus-klinis section) — transaction change
 * history page at /clinical/transactions/[id]/history, reached from the
 * "Lihat Riwayat" button at the bottom of the transaction detail page.
 *
 * Uses a fixed demo transaction id (TRX-20260815-3E55BD, Cardiology unit,
 * org "System Health Organization") that already has a representative
 * 3-event timeline: transaction created, file uploaded, AI processing
 * completed. SUP logs in via /clinical (unit=general) then navigates
 * straight to the detail/history URLs by id — no unit picker interaction
 * needed for these two specific pages.
 */
const TRANSACTION_ID = '66913afc-6e6e-4ae9-bd8a-fce45958aac6'

module.exports = [
  {
    id: 'kasus-klinis__riwayat-perubahan-kasus__01-tombol-lihat-riwayat',
    section: 'kasus-klinis',
    pageSlug: 'riwayat-perubahan-kasus',
    stepSlug: '01-tombol-lihat-riwayat',
    route: `/clinical/transactions/${TRANSACTION_ID}`,
    role: 'SUP',
    fullPage: true,
    annotate: [
      { type: 'box', x: 1245, y: 1263, width: 137, height: 48 }
    ]
  },
  {
    id: 'kasus-klinis__riwayat-perubahan-kasus__02-linimasa-riwayat',
    section: 'kasus-klinis',
    pageSlug: 'riwayat-perubahan-kasus',
    stepSlug: '02-linimasa-riwayat',
    route: `/clinical/transactions/${TRANSACTION_ID}/history`,
    role: 'SUP',
    annotate: [
      { type: 'box', x: 280, y: 308, width: 1136, height: 440 }
    ]
  }
]
