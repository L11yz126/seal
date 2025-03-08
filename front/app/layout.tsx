import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '印章识别系统',
  description: 'Created with 11',
  generator: '11',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
