"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, getDocs } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Hospital {
  id: string
  name: string
  logoUrl?: string
}

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"cirujano" | "neurofisiologo" | "administrativo" | "jefe_departamento">("cirujano")
  const [hospital, setHospital] = useState("")
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([])
  const [gender, setGender] = useState<"male" | "female">("male")
  const [error, setError] = useState("")
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { signup } = useAuth()
  const router = useRouter()

  // Fetch hospitals on component mount
  useEffect(() => {
    const fetchHospitals = async () => {
      setIsLoadingHospitals(true)
      try {
        console.log("Fetching hospitals for signup...")
        const hospitalsRef = collection(db, "hospitals")
        const snapshot = await getDocs(hospitalsRef)

        if (snapshot.empty) {
          console.log("No hospitals found in database")
          setHospitals([])
        } else {
          const hospitalsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            logoUrl: doc.data().logoUrl,
          }))
          console.log(`Found ${hospitalsList.length} hospitals:`, hospitalsList)
          setHospitals(hospitalsList)
        }
      } catch (error) {
        console.error("Error fetching hospitals:", error)
        setError("Error al cargar la lista de hospitales. Por favor, intente de nuevo.")
      } finally {
        setIsLoadingHospitals(false)
      }
    }

    fetchHospitals()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProfilePicture(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleHospitalChange = (hospitalId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedHospitals((prev) => [...prev, hospitalId])
    } else {
      setSelectedHospitals((prev) => prev.filter((id) => id !== hospitalId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    setError("")

    try {
      // Validate required fields
      if (!email || !password || !name) {
        throw new Error("Por favor complete todos los campos requeridos")
      }

      // Validate hospital selection based on role
      if (role === "cirujano" && !hospital) {
        throw new Error("Por favor seleccione un hospital")
      }

      if (role === "neurofisiologo" && selectedHospitals.length === 0) {
        throw new Error("Por favor seleccione al menos un hospital donde trabaja")
      }

      let profilePictureUrl = ""

      // Upload profile picture if selected
      if (profilePicture) {
        try {
          const storageRef = ref(storage, `profile-pictures/${Date.now()}-${profilePicture.name}`)
          await uploadBytes(storageRef, profilePicture)
          profilePictureUrl = await getDownloadURL(storageRef)
          console.log("Profile picture uploaded successfully:", profilePictureUrl)
        } catch (uploadError) {
          console.error("Error uploading profile picture:", uploadError)
          // Continue with signup even if image upload fails
        }
      }

      // Create user with appropriate hospital data
      if (role === "neurofisiologo") {
        console.log("Creating neurofisiologo with hospitals:", selectedHospitals)
        await signup(email, password, name, role, gender, profilePictureUrl, "", selectedHospitals)
      } else {
        console.log("Creating user with hospital:", hospital)
        await signup(email, password, name, role, gender, profilePictureUrl, hospital)
      }

      // Redirect to dashboard on success
      router.push("/dashboard")
    } catch (error) {
      setError("Error al crear la cuenta: " + (error instanceof Error ? error.message : "Error desconocido"))
      console.error("Signup error:", error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Crear Cuenta en NeuroTrack</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="ejemplo@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Nombre completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Dr. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium">
                Rol
              </label>
              <select
                id="role"
                name="role"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "cirujano" | "neurofisiologo" | "administrativo" | "jefe_departamento")
                }
              >
                <option value="cirujano">Cirujano</option>
                <option value="neurofisiologo">Neurofisiólogo</option>
                <option value="jefe_departamento">Jefe de Departamento</option>
                <option value="administrativo">Administrativo</option>
              </select>
            </div>

            {role === "cirujano" && (
              <div className="space-y-2">
                <label htmlFor="hospital" className="block text-sm font-medium">
                  Hospital
                </label>
                <select
                  id="hospital"
                  name="hospital"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                >
                  <option value="">Seleccionar hospital</option>
                  {isLoadingHospitals ? (
                    <option disabled>Cargando hospitales...</option>
                  ) : hospitals.length === 0 ? (
                    <option disabled>No hay hospitales disponibles</option>
                  ) : (
                    hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))
                  )}
                </select>
                {hospitals.length === 0 && !isLoadingHospitals && (
                  <p className="text-sm text-red-500">
                    No hay hospitales disponibles. Por favor, contacte al administrador.
                  </p>
                )}
              </div>
            )}

            {role === "neurofisiologo" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">Hospitales donde trabaja</label>
                <div className="border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto">
                  {isLoadingHospitals ? (
                    <p className="text-sm text-gray-500">Cargando hospitales...</p>
                  ) : hospitals.length === 0 ? (
                    <p className="text-sm text-red-500">
                      No hay hospitales disponibles. Por favor, contacte al administrador.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {hospitals.map((h) => (
                        <div key={h.id} className="flex items-center">
                          <Checkbox
                            id={`hospital-${h.id}`}
                            checked={selectedHospitals.includes(h.id)}
                            onCheckedChange={(checked) => handleHospitalChange(h.id, checked === true)}
                          />
                          <label htmlFor={`hospital-${h.id}`} className="ml-2 text-sm">
                            {h.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="gender" className="block text-sm font-medium">
                Género
              </label>
              <select
                id="gender"
                name="gender"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={gender}
                onChange={(e) => setGender(e.target.value as "male" | "female")}
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-picture" className="block text-sm font-medium">
                Foto de perfil (Opcional)
              </label>
              <div className="mt-1 flex items-center">
                {previewUrl ? (
                  <div className="relative h-20 w-20 rounded-full overflow-hidden">
                    <Image
                      src={previewUrl || "/placeholder.svg"}
                      alt="Vista previa del perfil"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="inline-block h-20 w-20 rounded-full overflow-hidden bg-gray-100">
                    <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </span>
                )}
                <button
                  type="button"
                  className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Cambiar
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? "Creando cuenta..." : "Registrarse"}
            </Button>

            <div className="text-center text-sm">
              ¿Ya tienes una cuenta?{" "}
              <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Iniciar sesión
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

