import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: {
    default: 'RizqinaStore — Belanja UMKM Terpercaya',
    template: '%s | RizqinaStore',
  },
  description:
    'Temukan produk berkualitas dari UMKM lokal. Belanja mudah, aman, dan terpercaya.',
  keywords: ['toko online', 'umkm', 'belanja online', 'produk lokal'],
  openGraph: {
    title: 'RizqinaStore — Belanja UMKM Terpercaya',
    description: 'Temukan produk berkualitas dari UMKM lokal.',
    type: 'website',
  },
}

import Script from 'next/script'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('umkm-theme');
                if (theme === 'elderly') {
                  document.documentElement.setAttribute('data-theme', 'elderly');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        {/* Midtrans Snap */}
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            },
          }}
        />
      </body>
    </html>
  )
}
