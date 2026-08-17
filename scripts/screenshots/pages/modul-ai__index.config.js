module.exports = [
  {
    id: 'modul-ai__index__01-daftar-modul',
    section: 'modul-ai',
    pageSlug: 'index',
    stepSlug: '01-daftar-modul',
    route: '/ai-registry',
    role: 'SUP',
    annotate: [
      { type: 'box', x: 288, y: 145, width: 1120, height: 100 },
      { type: 'box', x: 970, y: 520, width: 75, height: 32 },
      { type: 'box', x: 1272, y: 522, width: 104, height: 34 }
    ]
  },
  {
    id: 'modul-ai__index__02-cari-modul',
    section: 'modul-ai',
    pageSlug: 'index',
    stepSlug: '02-cari-modul',
    route: '/ai-registry',
    role: 'SUP',
    preActions: async (page) => {
      await page.fill('input[type="search"]', 'ECG')
      await page.waitForTimeout(300)
    },
    annotate: [
      { type: 'box', x: 305, y: 300, width: 580, height: 40 },
      { type: 'box', x: 1000, y: 685, width: 45, height: 22 }
    ]
  }
]
