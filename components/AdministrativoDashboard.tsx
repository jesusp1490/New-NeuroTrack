"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/context/AuthContext"
import OperatingRoomCalendar from "./OperatingRoomCalendar"
import SurgeryBookingDialog, { type SlotInfo } from "./SurgeryBookingDialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, Info, LogOut, User, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import HospitalLogo from "./HospitalLogo"

interface AdministrativoDashboardProps {
  hospitalId: string
  hospitalName: string
}

interface SurgeryData {
  id: string
  date: string
  surgeryType: string
  patientName: string
  neurophysiologistNames?: string[]
  status: string
  estimatedDuration: number
  hospitalId: string
  surgeonId: string
  surgeonName?: string
  neurophysiologistIds?: string[]
  neurophysiologistId?: string
  bookedBy?: {
    id: string
    name: string
    role: string
    email: string
  }
}

export default function AdministrativoDashboard({ hospitalId, hospitalName }: AdministrativoDashboardProps) {
  const { userData, logout } = useAuth()
  const router = useRouter()
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | undefined>(undefined)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState("calendar")
  const [surgeries, setSurgeries] = useState<SurgeryData[]>([])
  const [loading, setLoading] = useState(true)
  const [hospitalLogo, setHospitalLogo] = useState<string | undefined>(undefined)

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  useEffect(() => {
    const fetchSurgeries = async () => {
      if (!hospitalId) return

      try {
        setLoading(true)
        const surgeriesRef = collection(db, "surgeries")
        const q = query(surgeriesRef, where("hospitalId", "==", hospitalId))

        const querySnapshot = await getDocs(q)
        const surgeriesData = (await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const surgeryData = docSnapshot.data()

            // Get surgeon name
            let surgeonName = "Desconocido"
            if (surgeryData.surgeonId) {
              try {
                const surgeonDoc = await getDoc(doc(db, "users", surgeryData.surgeonId))
                if (surgeonDoc.exists()) {
                  surgeonName = surgeonDoc.data().name
                }
              } catch (error) {
                console.error("Error fetching surgeon data:", error)
              }
            }

            // Get neurophysiologist names
            const neurophysiologistNames: string[] = []
            const neuroIds =
              surgeryData.neurophysiologistIds ||
              (surgeryData.neurophysiologistId ? [surgeryData.neurophysiologistId] : [])

            if (neuroIds.length > 0) {
              for (const neuroId of neuroIds) {
                try {
                  const userDocRef = doc(db, "users", neuroId)
                  const userDocSnapshot = await getDoc(userDocRef)
                  if (userDocSnapshot.exists()) {
                    const userData = userDocSnapshot.data()
                    neurophysiologistNames.push(userData.name || "No asignado")
                  }
                } catch (error) {
                  console.error("Error fetching neurophysiologist:", error)
                }
              }
            }

            return {
              id: docSnapshot.id,
              ...surgeryData,
              surgeonName,
              neurophysiologistNames,
            }
          }),
        )) as SurgeryData[]

        // Sort by date (newest to oldest)
        surgeriesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setSurgeries(surgeriesData)

        // Fetch hospital logo
        try {
          const hospitalDoc = await getDoc(doc(db, "hospitals", hospitalId))
          if (hospitalDoc.exists()) {
            setHospitalLogo(hospitalDoc.data().logoUrl)
          }
        } catch (error) {
          console.error("Error fetching hospital logo:", error)
        }
      } catch (error) {
        console.error("Error fetching surgeries:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSurgeries()
  }, [hospitalId, refreshTrigger])

  const handleOpenBooking = (slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo)
    setIsBookingOpen(true)
  }

  const handleBookSurgery = () => {
    setSelectedSlot(undefined)
    setIsBookingOpen(true)
  }

  const handleCloseBooking = () => {
    setIsBookingOpen(false)
    setSelectedSlot(undefined)
  }

  const handleBookingComplete = () => {
    setIsBookingOpen(false)
    setSelectedSlot(undefined)
    setRefreshTrigger((prev) => prev + 1)
  }

  if (!userData) {
    return <div>Cargando datos del usuario...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-0 pb-2">
          <div className="flex flex-col items-center">
            <HospitalLogo logoUrl={hospitalLogo} hospitalName={hospitalName} size="3xl" className="mb-2" />
            <CardTitle className="text-xl mb-0">Panel Administrativo - {hospitalName}</CardTitle>
            <CardDescription className="mt-0">
              Gestione las cirugías y consulte la disponibilidad de neurofisiólogos y cirujanos
            </CardDescription>
          </div>
          <div className="flex justify-end items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              <span className="font-medium">{userData?.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-700">
              Como Personal Administrativo, puede programar cirugías seleccionando cirujanos y neurofisiólogos
              disponibles.
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
              <TabsTrigger value="surgeries">Cirugías</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <div className="flex justify-end mb-4">
                <Button onClick={handleBookSurgery} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Programar Cirugía
                </Button>
              </div>
              <OperatingRoomCalendar
                hospitalId={hospitalId}
                hospitalName={hospitalName}
                onSelectSlot={handleOpenBooking}
                onBookSurgery={handleBookSurgery}
                refreshTrigger={refreshTrigger}
                userRole="administrativo"
                userId={userData?.id}
              />
            </TabsContent>

            <TabsContent value="surgeries">
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : surgeries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay cirugías programadas</div>
              ) : (
                <div className="space-y-4">
                  {surgeries.map((surgery) => (
                    <Card key={surgery.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{surgery.surgeryType}</h4>
                          <p className="text-sm text-gray-500">Paciente: {surgery.patientName}</p>
                          <p className="text-sm text-gray-500">Cirujano: {surgery.surgeonName}</p>
                          {surgery.neurophysiologistNames && surgery.neurophysiologistNames.length > 0 ? (
                            <div>
                              <p className="text-sm text-gray-500 font-medium">
                                {surgery.neurophysiologistNames.length === 1 ? "Neurofisiólogo:" : "Neurofisiólogos:"}
                              </p>
                              {surgery.neurophysiologistNames.length === 1 ? (
                                <p className="text-sm text-gray-500">{surgery.neurophysiologistNames[0]}</p>
                              ) : (
                                <ul className="text-sm text-gray-500 list-disc pl-5">
                                  {surgery.neurophysiologistNames.map((name, index) => (
                                    <li key={index}>{name}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Neurofisiólogo: No especificado</p>
                          )}
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {format(new Date(surgery.date), "d 'de' MMMM 'de' yyyy", {
                              locale: es,
                            })}
                          </div>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {format(new Date(surgery.date), "h:mm a")} -
                            {format(
                              new Date(new Date(surgery.date).getTime() + surgery.estimatedDuration * 60000),
                              "h:mm a",
                            )}
                          </div>
                          {surgery.bookedBy && (
                            <p className="text-xs text-gray-500 mt-2">
                              Programada por: {surgery.bookedBy.name} (
                              {surgery.bookedBy.role === "jefe_departamento"
                                ? "Jefe de Departamento"
                                : surgery.bookedBy.role === "administrativo"
                                  ? "Personal Administrativo"
                                  : surgery.bookedBy.role === "cirujano"
                                    ? "Cirujano"
                                    : "Neurofisiólogo"}
                              )
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            surgery.status === "scheduled"
                              ? "default"
                              : surgery.status === "completed"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {surgery.status === "scheduled"
                            ? "Programada"
                            : surgery.status === "completed"
                              ? "Completada"
                              : surgery.status === "cancelled"
                                ? "Cancelada"
                                : "Desconocido"}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <SurgeryBookingDialog
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        onComplete={handleBookingComplete}
        selectedSlot={selectedSlot}
        userData={userData}
        hospitalId={hospitalId}
        hospitalName={hospitalName}
      />
    </div>
  )
}

