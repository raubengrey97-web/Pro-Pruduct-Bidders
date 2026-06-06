import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pro Product Bidders',
  description: 'Auction platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
