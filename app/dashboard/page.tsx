"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"
import CirujanoDashboard from "@/components/CirujanoDashboard"
import NeurofisiologoDashboard from "@/components/NeurofisiologoDashboard"
import JefeDepartamentoDashboard from "@/components/JefeDepartamentoDashboard"
import AdministrativoDashboard from "@/components/AdministrativoDashboard"
import HospitalSelector from "@/components/HospitalSelector"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
// Import the debug component at the top
// import HospitalDebug from "@/components/HospitalDebug"

export default function Dashboard() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("")
  const [selectedHospitalName, setSelectedHospitalName] = useState<string>("")
  const [availableHospitals, setAvailableHospitals] = useState<{ id: string; name: string; logoUrl?: string }[]>([])
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log("No authenticated user, redirecting to login")
      router.push("/login")
    }
  }, [user, loading, router])

  // Debug logging
  useEffect(() => {
    console.log("Dashboard state:", {
      loading,
      user: user ? `Authenticated: ${user.email}` : "Not authenticated",
      userData: userData ? `Role: ${userData.role}` : "No user data",
      isLoadingHospitals,
    })
  }, [loading, user, userData, isLoadingHospitals])

  useEffect(() => {
    // Only proceed if userData is available
    if (!userData) {
      return
    }

    const fetchHospitalDetails = async () => {
      setIsLoadingHospitals(true)
      try {
        console.log("Fetching hospital details for user role:", userData.role)

        // For surgeons, use their assigned hospital
        if (userData.role === "cirujano" && userData.hospitalId) {
          try {
            const hospitalDoc = await getDoc(doc(db, "hospitals", userData.hospitalId))
            if (hospitalDoc.exists()) {
              const hospitalName = hospitalDoc.data().name
              console.log(`Loaded surgeon's hospital: ${hospitalName}`)
              setSelectedHospitalId(userData.hospitalId)
              setSelectedHospitalName(hospitalName)
            } else {
              console.error("Hospital document does not exist:", userData.hospitalId)
            }
          } catch (error) {
            console.error("Error loading hospital details:", error)
          }
        }
        // For neurophysiologists, load their available hospitals
        else if (userData.role === "neurofisiologo" && userData.hospitals && userData.hospitals.length > 0) {
          console.log("Loading hospitals for neurophysiologist:", userData.hospitals)
          const hospitals = []
          for (const hospitalId of userData.hospitals) {
            try {
              const hospitalDoc = await getDoc(doc(db, "hospitals", hospitalId))
              if (hospitalDoc.exists()) {
                hospitals.push({
                  id: hospitalId,
                  name: hospitalDoc.data().name,
                  logoUrl: hospitalDoc.data().logoUrl, // Make sure this line is present
                })
              } else {
                console.error("Hospital document does not exist:", hospitalId)
              }
            } catch (error) {
              console.error(`Error loading hospital details ${hospitalId}:`, error)
            }
          }
          console.log("Loaded hospitals:", hospitals)
          setAvailableHospitals(hospitals)

          // Select the first hospital by default
          if (hospitals.length > 0) {
            setSelectedHospitalId(hospitals[0].id)
            setSelectedHospitalName(hospitals[0].name)
          } else {
            console.error("No valid hospitals found for neurophysiologist")
          }
        } else if (userData.role === "jefe_departamento" || userData.role === "administrativo") {
          // For department heads and admins, load all hospitals or their assigned hospital
          if (userData.hospitalId) {
            try {
              const hospitalDoc = await getDoc(doc(db, "hospitals", userData.hospitalId))
              if (hospitalDoc.exists()) {
                const hospitalName = hospitalDoc.data().name
                console.log(`Loaded admin/department head hospital: ${hospitalName}`)
                setSelectedHospitalId(userData.hospitalId)
                setSelectedHospitalName(hospitalName)
              } else {
                console.error("Hospital document does not exist:", userData.hospitalId)
              }
            } catch (error) {
              console.error("Error loading hospital details:", error)
            }
          }
        } else {
          console.log("User has no assigned hospitals. Fetching only their assigned hospitals.")
          // For users without specific assignments, don't fetch all hospitals
          setAvailableHospitals([])
          setSelectedHospitalId("")
          setSelectedHospitalName("")
        }
      } catch (error) {
        console.error("Error in fetchHospitalDetails:", error)
      } finally {
        setIsLoadingHospitals(false)
      }
    }

    fetchHospitalDetails()
  }, [userData])

  // Show loading state while checking authentication or loading hospitals
  if (loading || (user && !userData) || isLoadingHospitals) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-2 text-gray-600">
          {loading
            ? "Verificando autenticación..."
            : !userData
              ? "Cargando datos de usuario..."
              : "Cargando hospitales..."}
        </p>
      </div>
    )
  }

  // If not loading but no user, don't render anything (will be redirected by useEffect)
  if (!user || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-2 text-gray-600">Redirigiendo...</p>
      </div>
    )
  }

  const handleHospitalChange = (hospitalId: string, hospitalName: string) => {
    console.log(`Hospital changed to: ${hospitalName} (${hospitalId})`)
    setSelectedHospitalId(hospitalId)
    setSelectedHospitalName(hospitalName)
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashbaord</h1>

      {userData.role === "neurofisiologo" && availableHospitals.length > 0 && (
        <div className="mb-6">
          <HospitalSelector
            onHospitalChange={handleHospitalChange}
            defaultHospitalId={selectedHospitalId}
            hospitals={availableHospitals}
            label="Seleccionar Hospital de Trabajo"
          />
        </div>
      )}

      {userData.role === "neurofisiologo" && availableHospitals.length === 0 && (
        <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md mb-6">
          <p className="text-yellow-800">
            No tiene hospitales asignados. Por favor, contacte al administrador para asignar hospitales a su cuenta.
          </p>
        </div>
      )}

      {userData.role !== "neurofisiologo" && userData.role !== "cirujano" && (
        <div className="mb-6">
          <HospitalSelector
            onHospitalChange={handleHospitalChange}
            defaultHospitalId={userData.hospitalId || undefined}
            label="Seleccionar Hospital"
          />
        </div>
      )}

      {userData.role === "cirujano" && selectedHospitalId && (
        <CirujanoDashboard hospitalId={selectedHospitalId} hospitalName={selectedHospitalName} />
      )}

      {userData.role === "neurofisiologo" && selectedHospitalId && (
        <NeurofisiologoDashboard hospitalId={selectedHospitalId} hospitalName={selectedHospitalName} />
      )}

      {userData.role === "jefe_departamento" && selectedHospitalId && (
        <JefeDepartamentoDashboard hospitalId={selectedHospitalId} hospitalName={selectedHospitalName} />
      )}

      {userData.role === "administrativo" && selectedHospitalId && (
        <AdministrativoDashboard hospitalId={selectedHospitalId} hospitalName={selectedHospitalName} />
      )}

      {!selectedHospitalId && (
        <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
          <p className="text-yellow-800">
            No se ha seleccionado ningún hospital o no hay hospitales disponibles para este usuario.
          </p>
        </div>
      )}

      {/* Add the debug component */}
      {/* {process.env.NODE_ENV !== "production" && <HospitalDebug />} */}
    </div>
  )
}

