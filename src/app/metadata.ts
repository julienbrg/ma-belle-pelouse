import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ma belle pelouse',
  description: 'Interactive 5x5 lawn grid visualization',

  openGraph: {
    title: 'Ma belle pelouse',
    description: 'En cette nouvelle saison, il faut tondre !',
    url: 'https://ma-belle-pelouse.netlify.app',
    siteName: 'Ma belle pelouse',
    images: [
      {
        url: '/huangshan.png',
        width: 1200,
        height: 630,
        alt: 'Ma belle pelouse',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Ma belle pelouse',
    description: 'En cette nouvelle saison, il faut tondre !',
    images: ['/huangshan.png'],
  },
}
