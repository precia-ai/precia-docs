/**
 * kasus-klinis / worklist-per-modul
 * Route: /clinical, tab "By AI Module" (Berdasarkan Modul AI).
 * Uses unit CARD - Cardiology (System Health Organization demo org), which
 * has 3 AI modules enabled and dozens of slots across pending/completed/
 * failed statuses — representative for screenshots.
 */

const UNIT_ID = 'e6cd3b2a-2515-424c-b218-aebe2173d0db' // CARD - Cardiology

// Selector for the "Transactions / By AI Module" tab pair, scoped to its
// wrapper class combo (stable, not text-based — class names don't change
// between locales).
const TAB_GROUP_SELECTOR =
  'div.inline-flex.rounded-lg.border.border-border.bg-muted\\/30.p-1'

// Selector for the filter row select elements (Modul AI, Status Slot) inside
// the "by module" panel.
const FILTER_SELECT_SELECTOR =
  'div.rounded-xl.border.border-border\\/70.bg-muted\\/20.p-4.mb-4 select'

async function gotoByModuleTab(page) {
  await page.waitForSelector(TAB_GROUP_SELECTOR);
  const tabButtons = page.locator(`${TAB_GROUP_SELECTOR} button`);
  await tabButtons.nth(1).click();
  await page.waitForSelector(FILTER_SELECT_SELECTOR);
  await page.waitForTimeout(700);
}

module.exports = [
  {
    id: 'kasus-klinis__worklist-per-modul__01-tab-modul-ai',
    section: 'kasus-klinis',
    pageSlug: 'worklist-per-modul',
    stepSlug: '01-tab-modul-ai',
    route: `/clinical?unit=${UNIT_ID}`,
    role: 'SUP',
    preActions: async (page) => {
      await page.waitForSelector(TAB_GROUP_SELECTOR);
      await page.waitForTimeout(500);
    },
    annotate: [
      { type: 'box', x: 404, y: 226, width: 190, height: 42 },
    ],
  },
  {
    id: 'kasus-klinis__worklist-per-modul__02-tabel-slot',
    section: 'kasus-klinis',
    pageSlug: 'worklist-per-modul',
    stepSlug: '02-tabel-slot',
    route: `/clinical?unit=${UNIT_ID}`,
    role: 'SUP',
    preActions: async (page) => {
      await gotoByModuleTab(page);
    },
    annotate: [
      { type: 'box', x: 306, y: 284, width: 806, height: 76 },
    ],
  },
  {
    id: 'kasus-klinis__worklist-per-modul__03-filter-modul',
    section: 'kasus-klinis',
    pageSlug: 'worklist-per-modul',
    stepSlug: '03-filter-modul',
    route: `/clinical?unit=${UNIT_ID}`,
    role: 'SUP',
    preActions: async (page) => {
      await gotoByModuleTab(page);
      const selects = page.locator(FILTER_SELECT_SELECTOR);
      await selects.nth(0).selectOption({ index: 1 });
      await page.waitForTimeout(700);
    },
    annotate: [
      { type: 'box', x: 320, y: 304, width: 224, height: 52 },
    ],
  },
  {
    id: 'kasus-klinis__worklist-per-modul__04-detail-hasil',
    section: 'kasus-klinis',
    pageSlug: 'worklist-per-modul',
    stepSlug: '04-detail-hasil',
    route: `/clinical?unit=${UNIT_ID}`,
    role: 'SUP',
    preActions: async (page) => {
      await gotoByModuleTab(page);
      const selects = page.locator(FILTER_SELECT_SELECTOR);
      await selects.nth(0).selectOption({ index: 1 });
      await page.waitForTimeout(500);
      // Status Slot option values are stable English literals (see
      // services/clinical SlotStatus), not translated text, so this is
      // locale-safe. Filtering to "completed" guarantees the first row has
      // an AI result to show instead of "not finished yet".
      const slotsResponse = page.waitForResponse(
        (res) => res.url().includes('/slots/') && res.url().includes('status=completed'),
      );
      await selects.nth(1).selectOption('completed');
      await slotsResponse;
      await page.waitForTimeout(500);
      const expandBtn = page.locator('table tbody tr button').first();
      await expandBtn.click();
      await page.waitForTimeout(900);
    },
    annotate: [
      { type: 'box', x: 316, y: 458, width: 36, height: 36 },
      {
        type: 'arrow',
        from: { x: 420, y: 560 },
        to: { x: 350, y: 490 },
      },
    ],
  },
]
