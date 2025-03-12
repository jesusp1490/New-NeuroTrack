import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthContextProvider } from "./context/AuthContext"
import { Toaster } from "@/components/ui/toast"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NeuroTrack",
  description: "Sistema de gestión de cirugías neurológicas",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthContextProvider>{children}</AuthContextProvider>
        <Toaster />
      </body>
    </html>
  )
}

