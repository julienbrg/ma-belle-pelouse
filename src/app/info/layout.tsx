import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Info | Ma belle pelouse',
  description: 'Comment tondre sa pelouse ?',

  openGraph: {
    title: 'Info | Ma belle pelouse',
    description: 'Comment tondre sa pelouse ?',
    url: 'https://ma-belle-pelouse.netlify.app/info',
    siteName: 'Ma belle pelouse',
    images: [
      {
        url: '/huangshan.png',
        width: 1200,
        height: 630,
        alt: 'Info | Ma belle pelouse',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Info | Ma belle pelouse',
    description: 'Comment tondre sa pelouse ?',
    images: ['/huangshan.png'],
  },
}

export default function NewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
