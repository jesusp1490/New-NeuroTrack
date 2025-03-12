"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "./context/AuthContext"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Direct URL to the logo in Firebase Storage
  const logoUrl =
    "https://firebasestorage.googleapis.com/v0/b/neurotrack-c6193.firebasestorage.app/o/NeuroTrack-logo.webp?alt=media&token=5129136c-bb08-4771-b2e2-317634925dca"

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-6 relative w-40 h-40">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {!imageError ? (
              <Image
                src={logoUrl || "/placeholder.svg"}
                alt="NeuroTrack Logo"
                fill
                className={`object-contain transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                priority
                unoptimized // Bypass image optimization for external URLs
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              // Fallback if logo can't be loaded
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-full">
                <span className="text-2xl font-bold text-primary">NT</span>
              </div>
            )}
          </div>
          {/* <CardTitle className="text-3xl font-bold text-primary">NeuroTrack</CardTitle> */}
          <CardDescription className="text-lg">Sistema de gestión de cirugías neurológicas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-center text-muted-foreground">
            Optimice la programación y gestión de cirugías neurológicas con nuestra plataforma especializada.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/signup">Crear Cuenta</Link>
          </Button>
        </CardFooter>
      </Card>

      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} NeuroTrack. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}

