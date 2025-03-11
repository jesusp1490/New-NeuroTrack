"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Building2 } from "lucide-react"
import Image from "next/image"

interface Hospital {
  id: string
  name: string
  logoUrl?: string
}

interface HospitalSelectorProps {
  onHospitalChange: (hospitalId: string, hospitalName: string) => void
  defaultHospitalId?: string
  label?: string
  showAllOption?: boolean // Add this to allow selecting "All Hospitals" for admin users
}

export default function HospitalSelector({
  onHospitalChange,
  defaultHospitalId,
  label = "Seleccionar Hospital",
  showAllOption = false,
}: HospitalSelectorProps) {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<string>(defaultHospitalId || "")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const hospitalsRef = collection(db, "hospitals")
        const snapshot = await getDocs(hospitalsRef)
        const hospitalsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          logoUrl: doc.data().logoUrl,
        }))
        setHospitals(hospitalsList)

        // Si tenemos hospitales y no hay un valor predeterminado, seleccionamos el primero
        if (hospitalsList.length > 0 && !defaultHospitalId) {
          if (showAllOption) {
            setSelectedHospital("all")
            onHospitalChange("all", "Todos los Hospitales")
          } else {
            setSelectedHospital(hospitalsList[0].id)
            onHospitalChange(hospitalsList[0].id, hospitalsList[0].name)
          }
        } else if (defaultHospitalId) {
          setSelectedHospital(defaultHospitalId)
          // Buscar el nombre del hospital predeterminado
          const defaultHospital = hospitalsList.find((h) => h.id === defaultHospitalId)
          if (defaultHospital) {
            onHospitalChange(defaultHospitalId, defaultHospital.name)
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error al cargar hospitales:", error)
        setIsLoading(false)
      }
    }

    fetchHospitals()
  }, [defaultHospitalId, onHospitalChange, showAllOption])

  const handleHospitalChange = (value: string) => {
    setSelectedHospital(value)
    if (value === "all") {
      onHospitalChange("all", "Todos los Hospitales")
    } else {
      const selectedHospitalName = hospitals.find((h) => h.id === value)?.name || ""
      onHospitalChange(value, selectedHospitalName)
    }
  }

  if (isLoading) {
    return <div>Cargando hospitales...</div>
  }

  if (hospitals.length === 0) {
    return <div>No se encontraron hospitales. Por favor, añada hospitales al sistema.</div>
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="hospital-selector" className="flex items-center text-sm font-medium">
        <Building2 className="h-4 w-4 mr-1 text-indigo-600" />
        {label}
      </Label>
      <Select value={selectedHospital} onValueChange={handleHospitalChange}>
        <SelectTrigger id="hospital-selector" className="w-full">
          <SelectValue placeholder="Seleccionar un hospital" />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all" className="flex items-center">
              Todos los Hospitales
            </SelectItem>
          )}
          {hospitals.map((hospital) => (
            <SelectItem key={hospital.id} value={hospital.id} className="flex items-center">
              {hospital.logoUrl ? (
                <div className="flex items-center">
                  <Image
                    src={hospital.logoUrl || "/placeholder.svg"}
                    alt={hospital.name}
                    width={24}
                    height={24}
                    className="mr-2 rounded-sm"
                  />
                  {hospital.name}
                </div>
              ) : (
                hospital.name
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

