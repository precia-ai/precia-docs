/**
 * Force the precia-fe app into a given locale before the app's JS mounts.
 * The app reads localStorage key "precia_locale" synchronously on first
 * render (context/I18nContext.tsx), no cookie/URL param exists.
 */
async function setLocale(page, locale) {
  await page.addInitScript((loc) => {
    window.localStorage.setItem('precia_locale', loc)
  }, locale)
}

module.exports = { setLocale }
