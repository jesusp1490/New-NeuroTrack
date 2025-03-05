"use client"

import React from "react"

import { useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("cirujano")

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (error) {
      setError("Failed to log in. " + (error instanceof Error ? error.message : "Invalid email or password"))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">NeuroTrack</CardTitle>
          <CardDescription className="text-center">
            Login to your account to manage surgeries and shifts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="cirujano" value={selectedRole} onValueChange={setSelectedRole}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="cirujano">Cirujano</TabsTrigger>
              <TabsTrigger value="neurofisiologo">Neurofisiólogo</TabsTrigger>
              <TabsTrigger value="jefe_departamento">Jefe Depto.</TabsTrigger>
              <TabsTrigger value="administrativo">Admin</TabsTrigger>
            </TabsList>

            {["cirujano", "neurofisiologo", "jefe_departamento", "administrativo"].map((role) => (
              <TabsContent key={role} value={role}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m.garcia@hospital.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading
                      ? "Logging in..."
                      : `Login as ${role.charAt(0).toUpperCase() + role.slice(1).replace("_", " ")}`}
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:text-blue-800">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

