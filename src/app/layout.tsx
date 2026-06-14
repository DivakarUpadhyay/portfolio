import type { Metadata } from 'next'
import { Cormorant_Garamond, Outfit, JetBrains_Mono } from 'next/font/google'
import { THEME_INIT_SCRIPT } from '@/lib/themeInit'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--fd',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--fb',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--fm',
  display: 'swap',
})

const BASE_URL = 'https://divakarupadhyay.dev'
const OG_IMAGE = `${BASE_URL}/candidatepic/DivakarUpadhyay.jpg`

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'Divakar R. Upadhyay — Sr. Software Engineer & Full-Stack .NET Developer',
    template: '%s | Divakar R. Upadhyay',
  },

  description:
    'Sr. Software Engineer with 8+ years in Microsoft .NET, specialising in C#, AngularJS, MSSQL, SSRS, Clean Architecture, and Web3. Built enterprise systems for Acer Group, Bajaj FinServ, HealthAssure, IGI. Based in Taiwan — Gold Card Holder. Open to new opportunities.',

  keywords: [
    'Divakar Upadhyay', 'Divakar R Upadhyay', 'Sr Software Engineer Taiwan',
    'Full-Stack .NET Developer', 'C# Developer', '.NET Core Developer',
    'AngularJS Developer', 'MSSQL Developer', 'SSRS Developer',
    'Enterprise Software Engineer', 'Third-Party Integration Expert',
    'Web3 Developer', 'Solidity Developer', 'Blockchain Developer',
    'Taiwan Software Engineer', 'Taiwan Gold Card Developer',
    'FinTech Developer', 'HealthTech Developer', 'Clean Architecture',
    'Next.js Developer', 'Azure DevOps', 'Dapper ORM', 'Umbraco CMS',
    'Acer Group Developer', 'Bajaj FinServ Developer',
  ],

  authors: [{ name: 'Divakar R. Upadhyay', url: 'https://github.com/divakarupadhyay' }],
  creator: 'Divakar R. Upadhyay',
  publisher: 'Divakar R. Upadhyay',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },

  openGraph: {
    type: 'profile',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Divakar R. Upadhyay — Portfolio',
    title: 'Divakar R. Upadhyay — Sr. Software Engineer',
    description:
      'Sr. Software Engineer with 8+ years in Microsoft .NET. Enterprise systems, third-party integrations, fintech, healthtech, and Web3. Based in Taiwan — Gold Card Holder.',
    images: [{ url: OG_IMAGE, width: 800, height: 1000, alt: 'Divakar R. Upadhyay — Sr. Software Engineer' }],
    firstName: 'Divakar',
    lastName: 'Upadhyay',
    gender: 'male',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Divakar R. Upadhyay — Sr. Software Engineer',
    description:
      'Sr. Software Engineer with 8+ years in Microsoft .NET. Enterprise systems, fintech, healthtech, Web3. Taiwan Gold Card Holder.',
    images: [OG_IMAGE],
  },

  category: 'technology',

  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable} ${jetbrains.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","x6r9wjejpv");` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
