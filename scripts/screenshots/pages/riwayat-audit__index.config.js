module.exports = [
  {
    id: 'riwayat-audit__index__01-tab-peristiwa',
    section: 'riwayat-audit',
    pageSlug: 'index',
    stepSlug: '01-tab-peristiwa',
    route: '/audit',
    role: 'SUP',
    annotate: [
      { type: 'box', x: 280, y: 315, width: 500, height: 40 },
      { type: 'box', x: 300, y: 386, width: 92, height: 34 },
      { type: 'box', x: 1330, y: 578, width: 40, height: 34 }
    ]
  },
  {
    id: 'riwayat-audit__index__02-filter-peristiwa',
    section: 'riwayat-audit',
    pageSlug: 'index',
    stepSlug: '02-filter-peristiwa',
    route: '/audit',
    role: 'SUP',
    preActions: async (page) => {
      await page.locator('[role="tabpanel"] button').first().click()
      await page.waitForSelector('[role="dialog"]', { state: 'visible' })
      await page.waitForTimeout(300)
    },
    annotate: [{ type: 'box', x: 883, y: 128, width: 536, height: 40 }]
  },
  {
    id: 'riwayat-audit__index__03-detail-peristiwa',
    section: 'riwayat-audit',
    pageSlug: 'index',
    stepSlug: '03-detail-peristiwa',
    route: '/audit?sensitive_access=true',
    role: 'SUP',
    preActions: async (page) => {
      const firstRowButton = page
        .locator('table tbody tr')
        .first()
        .locator('td')
        .last()
        .locator('button')
      await firstRowButton.click()
      await page.waitForSelector('[role="dialog"]', { state: 'visible' })
      await page.waitForTimeout(400)
    },
    annotate: [{ type: 'box', x: 789, y: 538, width: 630, height: 260 }]
  },
  {
    id: 'riwayat-audit__index__04-tab-kasus',
    section: 'riwayat-audit',
    pageSlug: 'index',
    stepSlug: '04-tab-kasus',
    route: '/audit',
    role: 'SUP',
    preActions: async (page) => {
      await page.locator('[role="tab"]').nth(1).click()
      await page.waitForTimeout(800)
      const firstCase = page.locator('ul.divide-y li button').first()
      if (await firstCase.count() > 0) {
        await firstCase.click()
        await page.waitForTimeout(500)
      }
    },
    annotate: [{ type: 'box', x: 983, y: 738, width: 407, height: 40 }]
  },
  {
    id: 'riwayat-audit__index__05-tab-temuan',
    section: 'riwayat-audit',
    pageSlug: 'index',
    stepSlug: '05-tab-temuan',
    route: '/audit',
    role: 'SUP',
    preActions: async (page) => {
      await page.locator('[role="tab"]').nth(2).click()
      await page.waitForTimeout(800)
    }
  },
  {
    id: 'riwayat-audit__index__06-tab-bukti',
    section: 'riwayat-audit',
    pageSlug: 'index',
    stepSlug: '06-tab-bukti',
    route: '/audit',
    role: 'SUP',
    preActions: async (page) => {
      await page.locator('[role="tab"]').nth(3).click()
      await page.waitForTimeout(800)
    }
  },
  {
    id: 'riwayat-audit__index__07-tab-tata-kelola',
    section: 'riwayat-audit',
    pageSlug: 'index',
    stepSlug: '07-tab-tata-kelola',
    route: '/audit',
    role: 'SUP',
    preActions: async (page) => {
      await page.locator('[role="tab"]').nth(4).click()
      await page.waitForTimeout(800)
      const cards = page.locator('[role="tabpanel"] .grid > div')
      const integrityCard = cards.nth(1)
      const btn = integrityCard.locator('button')
      if (await btn.count() > 0) {
        await btn.first().click()
        await page.waitForTimeout(2000)
      }
    },
    annotate: [
      { type: 'box', x: 304, y: 578, width: 254, height: 34 },
      { type: 'box', x: 873, y: 579, width: 213, height: 34 }
    ]
  }
]
