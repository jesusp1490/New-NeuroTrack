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
import { CalendarIcon, Clock, Info, LogOut, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import HospitalLogo from "./HospitalLogo"

interface CirujanoDashboardProps {
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
  neurophysiologistIds?: string[]
  neurophysiologistId?: string // Added to handle single neurophysiologist case
}

export default function CirujanoDashboard({ hospitalId, hospitalName }: CirujanoDashboardProps) {
  const { userData, logout } = useAuth()
  const router = useRouter()
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | undefined>(undefined)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState("calendar")
  const [mySurgeries, setMySurgeries] = useState<SurgeryData[]>([])
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
    const fetchMySurgeries = async () => {
      if (!userData?.id || !hospitalId) return

      try {
        setLoading(true)
        const surgeriesRef = collection(db, "surgeries")
        const q = query(surgeriesRef, where("surgeonId", "==", userData.id), where("hospitalId", "==", hospitalId))

        const querySnapshot = await getDocs(q)
        const surgeries = (await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const surgeryData = docSnapshot.data()
            const neurophysiologistNames: string[] = []

            // Handle both single neurophysiologist and multiple neurophysiologists cases
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
              neurophysiologistNames,
            }
          }),
        )) as SurgeryData[]

        // Sort by date (newest to oldest)
        surgeries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setMySurgeries(surgeries)

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

    fetchMySurgeries()
  }, [userData?.id, hospitalId])

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
            <CardTitle className="text-xl mb-0">Panel de Cirujano - {hospitalName}</CardTitle>
            <CardDescription className="mt-0">
              Gestiona tus cirugías y consulta la disponibilidad de neurofisiólogos
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
              Los turnos en <span className="font-medium text-green-600">verde</span> indican neurofisiólogos
              disponibles. Haz clic en un turno disponible para programar una cirugía.
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
              <TabsTrigger value="surgeries">Mis Cirugías</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <OperatingRoomCalendar
                hospitalId={hospitalId}
                hospitalName={hospitalName}
                onSelectSlot={handleOpenBooking}
                onBookSurgery={handleBookSurgery}
                refreshTrigger={refreshTrigger}
                userRole="cirujano"
                userId={userData?.id}
              />
            </TabsContent>

            <TabsContent value="surgeries">
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : mySurgeries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No has programado cirugías aún</div>
              ) : (
                <div className="space-y-4">
                  {mySurgeries.map((surgery) => (
                    <Card key={surgery.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{surgery.surgeryType}</h4>
                          <p className="text-sm text-gray-500">Paciente: {surgery.patientName}</p>
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
      {/* Removed the duplicate button here */}
    </div>
  )
}

