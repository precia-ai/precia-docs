import { Footer, Layout, LocaleSwitch, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: {
    default: 'Panduan Pengguna PRECIA',
    template: '%s | Panduan Pengguna PRECIA'
  },
  description:
    'Panduan resmi penggunaan PRECIA untuk dokter, admin unit, admin organisasi, dan admin platform.',
  icons: {
    icon: '/brand/precia-mark.png'
  }
}

const navbar = (
  <Navbar
    logo={
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/precia-mark.png" alt="" width={22} height={22} />
        <b>Panduan PRECIA</b>
      </span>
    }
  >
    <LocaleSwitch lite />
  </Navbar>
)

const footer = (
  <Footer>
    {new Date().getFullYear()} © PRECIA. Panduan pengguna.
  </Footer>
)

export default async function RootLayout({ children, params }) {
  const { lang } = await params

  return (
    <html lang={lang} dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap(`/${lang}`)}
          footer={footer}
          docsRepositoryBase="https://gitea.precia.site/precia/precia-docs/src/branch/main"
          editLink="Perbaiki halaman ini"
          feedback={{ content: null }}
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          i18n={[
            { locale: 'id', name: 'Bahasa Indonesia' },
            { locale: 'en', name: 'English' }
          ]}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
