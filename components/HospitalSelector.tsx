"use client"

import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import HospitalLogo from "./HospitalLogo"

export interface HospitalSelectorProps {
  onHospitalChange: (hospitalId: string, hospitalName: string) => void
  defaultHospitalId?: string
  label: string
  // If you want to pass hospitals directly instead of fetching them
  hospitals?: Array<{ id: string; name: string; logoUrl?: string }>
}

export default function HospitalSelector({
  onHospitalChange,
  defaultHospitalId,
  label,
  hospitals: propHospitals,
}: HospitalSelectorProps) {
  // Make sure the hospitals state includes logoUrl
  const [hospitals, setHospitals] = useState<Array<{ id: string; name: string; logoUrl?: string }>>([])
  const [selectedHospital, setSelectedHospital] = useState<string>(defaultHospitalId || "")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If hospitals are provided as props, use them
    if (propHospitals && propHospitals.length > 0) {
      setHospitals(propHospitals)
      setIsLoading(false)

      // If a default hospital ID is provided and it exists in the provided hospitals, select it
      if (defaultHospitalId) {
        const defaultHospital = propHospitals.find((h) => h.id === defaultHospitalId)
        if (defaultHospital) {
          setSelectedHospital(defaultHospitalId)
          onHospitalChange(defaultHospitalId, defaultHospital.name)
        } else if (propHospitals.length > 0) {
          // If default hospital not found, select the first one
          setSelectedHospital(propHospitals[0].id)
          onHospitalChange(propHospitals[0].id, propHospitals[0].name)
        }
      } else if (propHospitals.length > 0) {
        // If no default hospital, select the first one
        setSelectedHospital(propHospitals[0].id)
        onHospitalChange(propHospitals[0].id, propHospitals[0].name)
      }
      return
    }

    // Otherwise fetch hospitals from Firestore
    const fetchHospitals = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const hospitalsSnapshot = await getDocs(collection(db, "hospitals"))
        const hospitalsData = hospitalsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          logoUrl: doc.data().logoUrl,
        }))

        if (hospitalsData.length === 0) {
          setError("No hay hospitales disponibles en el sistema")
          setHospitals([])
          setIsLoading(false)
          return
        }

        setHospitals(hospitalsData)

        // If a default hospital ID is provided and it exists in the fetched hospitals, select it
        if (defaultHospitalId) {
          const defaultHospital = hospitalsData.find((h) => h.id === defaultHospitalId)
          if (defaultHospital) {
            setSelectedHospital(defaultHospitalId)
            onHospitalChange(defaultHospitalId, defaultHospital.name)
          } else if (hospitalsData.length > 0) {
            // If default hospital not found, select the first one
            setSelectedHospital(hospitalsData[0].id)
            onHospitalChange(hospitalsData[0].id, hospitalsData[0].name)
          }
        } else if (hospitalsData.length > 0) {
          // If no default hospital, select the first one
          setSelectedHospital(hospitalsData[0].id)
          onHospitalChange(hospitalsData[0].id, hospitalsData[0].name)
        }
      } catch (error) {
        console.error("Error fetching hospitals:", error)
        setError("Error al cargar los hospitales")
        setHospitals([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchHospitals()
  }, [defaultHospitalId, onHospitalChange, propHospitals])

  const handleHospitalChange = (value: string) => {
    setSelectedHospital(value)
    const selectedHospitalData = hospitals.find((h) => h.id === value)
    if (selectedHospitalData) {
      onHospitalChange(value, selectedHospitalData.name)
    }
  }

  const getSelectedHospitalLogo = () => {
    const hospital = hospitals.find((h) => h.id === selectedHospital)
    return hospital?.logoUrl
  }

  const getSelectedHospitalName = () => {
    const hospital = hospitals.find((h) => h.id === selectedHospital)
    return hospital?.name || "Seleccionar hospital"
  }

  if (isLoading) {
    return <div className="py-2 text-gray-500">Cargando hospitales...</div>
  }

  if (error) {
    return <div className="py-2 text-red-500">{error}</div>
  }

  if (hospitals.length === 0) {
    return <div className="py-2 text-gray-500">No hay hospitales disponibles</div>
  }

  // Ensure we're passing the logoUrl to the HospitalLogo component
  return (
    <div className="space-y-2">
      <Label htmlFor="hospital-selector">{label}</Label>
      <Select value={selectedHospital} onValueChange={handleHospitalChange}>
        <SelectTrigger id="hospital-selector" className="w-full py-2">
          <div className="flex items-center gap-3">
            <HospitalLogo logoUrl={getSelectedHospitalLogo()} hospitalName={getSelectedHospitalName()} size="md" />
            <span className="text-base">{getSelectedHospitalName()}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {hospitals.map((hospital) => (
            <SelectItem key={hospital.id} value={hospital.id} className="py-2">
              <div className="flex items-center gap-3">
                <HospitalLogo logoUrl={hospital.logoUrl} hospitalName={hospital.name} size="md" />
                <span>{hospital.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

