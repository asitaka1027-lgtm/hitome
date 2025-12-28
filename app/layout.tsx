import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'hitome - 統合Inbox',
  description: 'LINE・Google口コミを一元管理',
  manifest: '/manifest.json',
  themeColor: '#34C98E',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'hitome',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
