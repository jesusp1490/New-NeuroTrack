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

export default function Dashboard() {
  const { userData } = useAuth()
  const router = useRouter()
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("")
  const [selectedHospitalName, setSelectedHospitalName] = useState<string>("")
  const [availableHospitals, setAvailableHospitals] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!userData) {
      router.push("/login")
      return
    }

    const fetchHospitalDetails = async () => {
      // Para cirujanos, usar su hospital asignado
      if (userData.role === "cirujano" && userData.hospitalId) {
        try {
          const hospitalDoc = await getDoc(doc(db, "hospitals", userData.hospitalId))
          if (hospitalDoc.exists()) {
            const hospitalName = hospitalDoc.data().name
            setSelectedHospitalId(userData.hospitalId)
            setSelectedHospitalName(hospitalName)
          }
        } catch (error) {
          console.error("Error al cargar detalles del hospital:", error)
        }
      }
      // Para neurofisiólogos, cargar sus hospitales disponibles
      else if (userData.role === "neurofisiologo" && userData.hospitals && userData.hospitals.length > 0) {
        const hospitals = []
        for (const hospitalId of userData.hospitals) {
          try {
            const hospitalDoc = await getDoc(doc(db, "hospitals", hospitalId))
            if (hospitalDoc.exists()) {
              hospitals.push({
                id: hospitalId,
                name: hospitalDoc.data().name,
              })
            }
          } catch (error) {
            console.error(`Error al cargar detalles del hospital ${hospitalId}:`, error)
          }
        }
        setAvailableHospitals(hospitals)

        // Seleccionar el primer hospital por defecto
        if (hospitals.length > 0) {
          setSelectedHospitalId(hospitals[0].id)
          setSelectedHospitalName(hospitals[0].name)
        }
      }
    }

    fetchHospitalDetails()
  }, [userData, router])

  if (!userData) {
    return <div>Cargando...</div>
  }

  const handleHospitalChange = (hospitalId: string, hospitalName: string) => {
    setSelectedHospitalId(hospitalId)
    setSelectedHospitalName(hospitalName)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel de Control</h1>

      {userData.role === "neurofisiologo" && (
        <div className="mb-6">
          <HospitalSelector
            onHospitalChange={handleHospitalChange}
            defaultHospitalId={selectedHospitalId}
            label="Seleccionar Hospital de Trabajo"
          />
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
    </div>
  )
}

