/**
 * Screenshot spec for: Analitik Platform (Platform Analytics)
 * Route: /platform/analytics
 * Role: SUP (Super Administrator) — only role with monitoring:read_report_all_orgs
 * and evaluation:read_dashboard_all_orgs, so the page renders all four charts.
 *
 * All steps use the same full-page screenshot of the page (data does not
 * change), each with a different annotation box calling out the section
 * being explained in that step of the tutorial.
 */
module.exports = [
  {
    id: 'organisasi-platform__analitik-platform__01-ringkasan',
    section: 'organisasi-platform',
    pageSlug: 'analitik-platform',
    stepSlug: '01-ringkasan',
    route: '/platform/analytics',
    role: 'SUP',
    fullPage: true,
    annotate: [
      { type: 'box', x: 840, y: 50, width: 570, height: 48 },
      { type: 'box', x: 290, y: 145, width: 1120, height: 140 }
    ]
  },
  {
    id: 'organisasi-platform__analitik-platform__02-volume-tenant',
    section: 'organisasi-platform',
    pageSlug: 'analitik-platform',
    stepSlug: '02-volume-tenant',
    route: '/platform/analytics',
    role: 'SUP',
    fullPage: true,
    annotate: [
      { type: 'box', x: 290, y: 310, width: 1120, height: 325 }
    ]
  },
  {
    id: 'organisasi-platform__analitik-platform__03-adopsi-dormant',
    section: 'organisasi-platform',
    pageSlug: 'analitik-platform',
    stepSlug: '03-adopsi-dormant',
    route: '/platform/analytics',
    role: 'SUP',
    fullPage: true,
    annotate: [
      { type: 'box', x: 290, y: 650, width: 535, height: 330 },
      { type: 'box', x: 857, y: 650, width: 553, height: 330 }
    ]
  },
  {
    id: 'organisasi-platform__analitik-platform__04-tabel-perbandingan',
    section: 'organisasi-platform',
    pageSlug: 'analitik-platform',
    stepSlug: '04-tabel-perbandingan',
    route: '/platform/analytics',
    role: 'SUP',
    fullPage: true,
    annotate: [
      { type: 'box', x: 290, y: 995, width: 1120, height: 410 }
    ]
  }
]
