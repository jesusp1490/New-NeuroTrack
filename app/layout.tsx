import React from "react"
import { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthContextProvider } from "./context/AuthContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NeuroTrack",
  description: "Manage neurosurgery scheduling and tracking",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthContextProvider>{children}</AuthContextProvider>
      </body>
    </html>
  )
}

