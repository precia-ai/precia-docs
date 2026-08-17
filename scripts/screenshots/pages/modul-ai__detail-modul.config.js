const MODULE_ROUTE = '/ai-registry/6e8751cc-cd68-485f-bb8a-4b8179094fe2'

const PAD = 4

function box(bbox) {
  return {
    type: 'box',
    x: bbox.x - PAD,
    y: bbox.y - PAD,
    width: bbox.width + PAD * 2,
    height: bbox.height + PAD * 2
  }
}

// Bounding boxes measured directly per locale (button widths differ between
// Indonesian and English labels), see scripts/screenshots/pages/*.config.js
// convention: never hardcode a single box for text that changes length.
const BOXES = {
  id: {
    editDetails: { x: 1238, y: 107, width: 153, height: 40 },
    updateStatus: { x: 744, y: 393, width: 189, height: 40 },
    managePermissions: { x: 1246, y: 477, width: 145, height: 40 },
    statusOptions: { x: 513, y: 388.5, width: 414, height: 58 },
    noteBox: { x: 513, y: 486.5, width: 414, height: 80 },
    confirmBtn: { x: 713, y: 588.5, width: 214, height: 40 },
    nameInput: { x: 513, y: 325.5, width: 414, height: 40 },
    saveBtn: { x: 744, y: 669.5, width: 183, height: 40 }
  },
  en: {
    editDetails: { x: 1241, y: 107, width: 150, height: 40 },
    updateStatus: { x: 755, y: 393, width: 178, height: 40 },
    managePermissions: { x: 1161, y: 477, width: 230, height: 40 },
    statusOptions: { x: 513, y: 388.5, width: 414, height: 58 },
    noteBox: { x: 513, y: 486.5, width: 414, height: 80 },
    confirmBtn: { x: 768, y: 588.5, width: 159, height: 40 },
    nameInput: { x: 513, y: 325.5, width: 414, height: 40 },
    saveBtn: { x: 779, y: 669.5, width: 148, height: 40 }
  }
}

module.exports = [
  {
    id: 'modul-ai__detail-modul__01-detail-modul',
    section: 'modul-ai',
    pageSlug: 'detail-modul',
    stepSlug: '01-detail-modul',
    route: MODULE_ROUTE,
    role: 'SUP',
    annotate: ({ locale }) => [
      box(BOXES[locale].editDetails),
      box(BOXES[locale].updateStatus),
      box(BOXES[locale].managePermissions)
    ]
  },
  {
    id: 'modul-ai__detail-modul__02-dialog-ubah-status',
    section: 'modul-ai',
    pageSlug: 'detail-modul',
    stepSlug: '02-dialog-ubah-status',
    route: MODULE_ROUTE,
    role: 'SUP',
    preActions: async (page) => {
      await page.locator('button:has(svg.lucide-activity)').click()
      await page.waitForTimeout(400)
    },
    annotate: ({ locale }) => [
      box(BOXES[locale].statusOptions),
      box(BOXES[locale].noteBox),
      box(BOXES[locale].confirmBtn)
    ]
  },
  {
    id: 'modul-ai__detail-modul__03-dialog-edit-metadata',
    section: 'modul-ai',
    pageSlug: 'detail-modul',
    stepSlug: '03-dialog-edit-metadata',
    route: MODULE_ROUTE,
    role: 'SUP',
    preActions: async (page) => {
      await page.locator('button:has(svg.lucide-pencil-line)').click()
      await page.waitForTimeout(400)
    },
    annotate: ({ locale }) => [
      box(BOXES[locale].nameInput),
      box(BOXES[locale].saveBtn)
    ]
  },
  {
    id: 'modul-ai__detail-modul__04-log-aktivitas',
    section: 'modul-ai',
    pageSlug: 'detail-modul',
    stepSlug: '04-log-aktivitas',
    route: MODULE_ROUTE,
    role: 'SUP',
    fullPage: true,
    preActions: async (page) => {
      await page.locator('button:has(svg.lucide-file-stack)').click()
      await page.waitForTimeout(1000)
    },
    annotate: [
      { type: 'box', x: 305, y: 1290, width: 200, height: 30 }
    ]
  }
]
