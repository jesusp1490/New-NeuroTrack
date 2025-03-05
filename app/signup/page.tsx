"use client"

import React from "react"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Checkbox } from "@/components/ui/checkbox"

interface Hospital {
  id: string
  name: string
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { signup } = useAuth()
  const router = useRouter()
  const storage = getStorage()

  useEffect(() => {
    // Cargar la lista de hospitales
    const fetchHospitals = async () => {
      try {
        const hospitalsRef = collection(db, "hospitals")
        const snapshot = await getDocs(hospitalsRef)
        const hospitalsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }))
        setHospitals(hospitalsList)
      } catch (error) {
        console.error("Error al cargar hospitales:", error)
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
      setSelectedHospitals([...selectedHospitals, hospitalId])
    } else {
      setSelectedHospitals(selectedHospitals.filter((id) => id !== hospitalId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    setError("")

    try {
      let profilePictureUrl = ""

      // Solo intentar subir si se seleccionó una foto de perfil
      if (profilePicture) {
        try {
          // Crear una referencia de almacenamiento
          const storageRef = ref(storage, `profile-pictures/${Date.now()}-${profilePicture.name}`)

          // Subir el archivo
          await uploadBytes(storageRef, profilePicture)

          // Obtener la URL de descarga
          profilePictureUrl = await getDownloadURL(storageRef)
        } catch (uploadError) {
          console.error("Error al subir la foto de perfil:", uploadError)
          // Continuar con el registro incluso si falla la carga
        }
      }

      // Crear usuario con o sin foto de perfil
      if (role === "neurofisiologo") {
        await signup(email, password, name, role, gender, profilePictureUrl, "", selectedHospitals)
      } else {
        await signup(email, password, name, role, gender, profilePictureUrl, hospital)
      }

      router.push("/dashboard")
    } catch (error) {
      setError("Error al crear la cuenta. " + (error instanceof Error ? error.message : "Error desconocido"))
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Registrar una cuenta</h2>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="name" className="sr-only">
                Nombre completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="role" className="sr-only">
                Rol
              </label>
              <select
                id="role"
                name="role"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "cirujano" | "neurofisiologo" | "administrativo" | "jefe_departamento")
                }
              >
                <option value="cirujano">Cirujano</option>
                <option value="neurofisiologo">Neurofisiólogo</option>
                <option value="administrativo">Administrativo</option>
                <option value="jefe_departamento">Jefe de Departamento</option>
              </select>
            </div>
            {role === "cirujano" && (
              <div>
                <label htmlFor="hospital" className="sr-only">
                  Hospital
                </label>
                <select
                  id="hospital"
                  name="hospital"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                >
                  <option value="">Seleccionar hospital</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {role === "neurofisiologo" && (
              <div className="p-4 border border-gray-300">
                <p className="text-sm font-medium mb-2">Seleccione los hospitales donde trabaja:</p>
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
              </div>
            )}
            <div>
              <label htmlFor="gender" className="sr-only">
                Género
              </label>
              <select
                id="gender"
                name="gender"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                value={gender}
                onChange={(e) => setGender(e.target.value as "male" | "female")}
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="profile-picture" className="block text-sm font-medium text-gray-700">
              Foto de perfil (Opcional)
            </label>
            <div className="mt-1 flex items-center">
              {previewUrl ? (
                <Image
                  src={previewUrl || "/placeholder.svg"}
                  alt="Vista previa del perfil"
                  width={100}
                  height={100}
                  className="rounded-full"
                />
              ) : (
                <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
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
            <p className="mt-1 text-xs text-gray-500">
              Nota: La carga de la foto de perfil es opcional. Si encuentra algún problema, puede continuar sin ella y
              añadirla más tarde.
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={isUploading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isUploading ? "Creando cuenta..." : "Registrarse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

