import Footer from './Footer'
import type React from 'react'

export default function Layout({ children, showFooter = true }: { children: React.ReactNode; showFooter?: boolean }) {
  return (
    <main className="flex min-h-screen w-full max-w-full flex-col items-center overflow-x-hidden pb-4">
      {children}
      {showFooter && <Footer />}
    </main>
  )
}
