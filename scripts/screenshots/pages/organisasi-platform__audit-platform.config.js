/**
 * Screenshot spec for: Audit Platform (cross-organization compliance audit)
 * Route: /platform/audit
 *
 * Same AuditWorkspace component as the org-level /audit page, but reached
 * from the platform sidebar with audit:read_all_orgs permission, so
 * PlatformScopeNotice renders above the workspace and no organization
 * filter is pinned. Tab order is fixed: events, cases, findings, evidence,
 * governance — used for stable nth-child selectors since tab labels differ
 * per locale.
 */
module.exports = [
  {
    id: 'organisasi-platform__audit-platform__01-ringkasan',
    section: 'organisasi-platform',
    pageSlug: 'audit-platform',
    stepSlug: '01-ringkasan',
    route: '/platform/audit',
    role: 'SUP',
    annotate: [
      { type: 'box', x: 286, y: 38, width: 1124, height: 50 },
      { type: 'box', x: 1024, y: 111, width: 384, height: 62 }
    ]
  },
  {
    id: 'organisasi-platform__audit-platform__02-filter',
    section: 'organisasi-platform',
    pageSlug: 'audit-platform',
    stepSlug: '02-filter',
    route: '/platform/audit',
    role: 'SUP',
    preActions: async (page) => {
      await page.waitForSelector('[role="tabpanel"] button')
      await page.locator('[role="tabpanel"] button').first().click()
      await page.waitForTimeout(500)
    },
    annotate: [
      { type: 'box', x: 886, y: 100, width: 250, height: 60 },
      { type: 'box', x: 1259, y: 828, width: 146, height: 40 }
    ]
  },
  {
    id: 'organisasi-platform__audit-platform__03-detail-peristiwa',
    section: 'organisasi-platform',
    pageSlug: 'audit-platform',
    stepSlug: '03-detail-peristiwa',
    route: '/platform/audit',
    role: 'SUP',
    preActions: async (page) => {
      await page.waitForSelector('table tbody tr')
      await page.locator('table tbody tr').first().locator('button').click()
      await page.waitForTimeout(600)
    },
    annotate: [
      { type: 'box', x: 1278, y: 428, width: 120, height: 34 }
    ]
  },
  {
    id: 'organisasi-platform__audit-platform__04-tab-kasus',
    section: 'organisasi-platform',
    pageSlug: 'audit-platform',
    stepSlug: '04-tab-kasus',
    route: '/platform/audit',
    role: 'SUP',
    preActions: async (page) => {
      await page.waitForSelector('[role="tablist"] button:nth-child(2)')
      await page.locator('[role="tablist"] button:nth-child(2)').click()
      await page.waitForTimeout(700)
    },
    annotate: [
      { type: 'arrow', from: { x: 1130, y: 520 }, to: { x: 1290, y: 478 } }
    ]
  },
  {
    id: 'organisasi-platform__audit-platform__05-tab-temuan',
    section: 'organisasi-platform',
    pageSlug: 'audit-platform',
    stepSlug: '05-tab-temuan',
    route: '/platform/audit',
    role: 'SUP',
    preActions: async (page) => {
      await page.waitForSelector('[role="tablist"] button:nth-child(3)')
      await page.locator('[role="tablist"] button:nth-child(3)').click()
      await page.waitForTimeout(700)
    }
  },
  {
    id: 'organisasi-platform__audit-platform__06-tab-bukti',
    section: 'organisasi-platform',
    pageSlug: 'audit-platform',
    stepSlug: '06-tab-bukti',
    route: '/platform/audit',
    role: 'SUP',
    preActions: async (page) => {
      await page.waitForSelector('[role="tablist"] button:nth-child(4)')
      await page.locator('[role="tablist"] button:nth-child(4)').click()
      await page.waitForTimeout(700)
    }
  },
  {
    id: 'organisasi-platform__audit-platform__07-tab-tata-kelola',
    section: 'organisasi-platform',
    pageSlug: 'audit-platform',
    stepSlug: '07-tab-tata-kelola',
    route: '/platform/audit',
    role: 'SUP',
    preActions: async (page) => {
      await page.waitForSelector('[role="tablist"] button:nth-child(5)')
      await page.locator('[role="tablist"] button:nth-child(5)').click()
      await page.waitForTimeout(700)
    },
    annotate: [
      { type: 'box', x: 876, y: 585, width: 190, height: 36 }
    ]
  }
]
