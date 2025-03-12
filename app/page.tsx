"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "./context/AuthContext"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

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
          <div className="mx-auto mb-4 relative w-24 h-24">
            <Image src="/logo.png" alt="NeuroTrack Logo" fill className="object-contain" priority />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">NeuroTrack</CardTitle>
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

