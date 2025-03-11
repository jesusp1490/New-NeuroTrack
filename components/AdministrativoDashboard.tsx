"use client"

import { useState, useEffect } from "react"
import OperatingRoomCalendar from "./OperatingRoomCalendar"
import SurgeryBookingDialog, { type SlotInfo } from "./SurgeryBookingDialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/app/context/AuthContext"
import HospitalSelector from "./HospitalSelector"
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface AdministrativoDashboardProps {
  hospitalId: string
  hospitalName: string
}

export default function AdministrativoDashboard({ hospitalId, hospitalName }: AdministrativoDashboardProps) {
  const { userData, logout } = useAuth()
  const router = useRouter()
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | undefined>(undefined)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState("calendar")
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitalId)
  const [selectedHospitalName, setSelectedHospitalName] = useState(hospitalName)
  const [allSurgeries, setAllSurgeries] = useState<
    Array<{
      id: string
      date?: string
      surgeryType?: string
      patientName?: string
      estimatedDuration?: number
      status?: string
      surgeonName: string
      hospitalName: string
      neurophysiologistNames: string[]
      [key: string]: any // Allow any additional properties
    }>
  >([])
  const [loading, setLoading] = useState(true)

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  useEffect(() => {
    const fetchAllSurgeries = async () => {
      if (!userData?.id) return

      try {
        setLoading(true)
        const surgeriesRef = collection(db, "surgeries")
        let surgeriesQuery

        if (selectedHospitalId === "all") {
          // Fetch surgeries from all hospitals
          surgeriesQuery = query(surgeriesRef)
        } else {
          // Fetch surgeries from the selected hospital
          surgeriesQuery = query(surgeriesRef, where("hospitalId", "==", selectedHospitalId))
        }

        const querySnapshot = await getDocs(surgeriesQuery)
        const surgeries = await Promise.all(
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

            // Get hospital name
            let hospitalName = "Hospital desconocido"
            if (surgeryData.hospitalId) {
              try {
                const hospitalDoc = await getDoc(doc(db, "hospitals", surgeryData.hospitalId))
                if (hospitalDoc.exists()) {
                  hospitalName = hospitalDoc.data().name
                }
              } catch (error) {
                console.error("Error fetching hospital data:", error)
              }
            }

            // Get neurophysiologist names
            const neurophysiologistNames: string[] = []
            const neuroIds =
              surgeryData.neurophysiologistIds ||
              (surgeryData.neurophysiologistId ? [surgeryData.neurophysiologistId] : [])

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

            // Use type assertion to ensure all required properties are included
            return {
              id: docSnapshot.id,
              date: surgeryData.date || "",
              surgeryType: surgeryData.surgeryType || "",
              patientName: surgeryData.patientName || "",
              estimatedDuration: surgeryData.estimatedDuration || 0,
              status: surgeryData.status || "unknown",
              surgeonName,
              hospitalName,
              neurophysiologistNames,
            } as const
          }),
        )

        // Sort by date
        surgeries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        setAllSurgeries(surgeries)
      } catch (error) {
        console.error("Error fetching surgeries:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllSurgeries()
  }, [userData?.id, selectedHospitalId, refreshTrigger])

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo)
    setIsBookingDialogOpen(true)
  }

  const handleBookSurgery = () => {
    setSelectedSlot(undefined)
    setIsBookingDialogOpen(true)
  }

  const handleBookingComplete = () => {
    setIsBookingDialogOpen(false)
    setSelectedSlot(undefined)
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleHospitalChange = (hospitalId: string, hospitalName: string) => {
    setSelectedHospitalId(hospitalId)
    setSelectedHospitalName(hospitalName)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Panel Administrativo</CardTitle>
            <CardDescription>Gestionar recursos hospitalarios y tareas administrativas</CardDescription>
          </div>
          <div className="flex items-center gap-4">
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
          <div className="mb-6">
            <HospitalSelector
              onHospitalChange={handleHospitalChange}
              defaultHospitalId={selectedHospitalId}
              showAllOption={true}
            />
          </div>

          <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
              <TabsTrigger value="surgeries">Cirugías</TabsTrigger>
              <TabsTrigger value="resources">Recursos</TabsTrigger>
              <TabsTrigger value="reports">Informes</TabsTrigger>
            </TabsList>
            <TabsContent value="calendar">
              {selectedHospitalId !== "all" ? (
                <OperatingRoomCalendar
                  hospitalId={selectedHospitalId}
                  hospitalName={selectedHospitalName}
                  onSelectSlot={handleSelectSlot}
                  onBookSurgery={handleBookSurgery}
                  refreshTrigger={refreshTrigger}
                  userRole="administrativo"
                />
              ) : (
                <div className="p-4 text-center bg-yellow-50 rounded-md border border-yellow-200">
                  Por favor, seleccione un hospital específico para ver el calendario.
                </div>
              )}
            </TabsContent>
            <TabsContent value="surgeries">
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : allSurgeries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay cirugías programadas</div>
              ) : (
                <div className="space-y-4">
                  {allSurgeries.map((surgery) => (
                    <Card key={surgery.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{surgery.surgeryType}</h4>
                          <p className="text-sm text-gray-500">Paciente: {surgery.patientName}</p>
                          <p className="text-sm text-gray-500">Cirujano: {surgery.surgeonName}</p>
                          <p className="text-sm text-gray-500">Hospital: {surgery.hospitalName}</p>
                          {surgery.neurophysiologistNames && surgery.neurophysiologistNames.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-500 font-medium">
                                {surgery.neurophysiologistNames.length === 1 ? "Neurofisiólogo:" : "Neurofisiólogos:"}
                              </p>
                              {surgery.neurophysiologistNames.length === 1 ? (
                                <p className="text-sm text-gray-500">{surgery.neurophysiologistNames[0]}</p>
                              ) : (
                                <ul className="text-sm text-gray-500 list-disc pl-5">
                                  {surgery.neurophysiologistNames.map((name: string, index: number) => (
                                    <li key={index}>{name}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {surgery.date
                              ? format(new Date(surgery.date), "d 'de' MMMM 'de' yyyy", {
                                  locale: es,
                                })
                              : "Fecha no disponible"}
                          </div>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {surgery.date ? format(new Date(surgery.date), "h:mm a") : "Hora no disponible"}
                            {surgery.date && surgery.estimatedDuration
                              ? ` - ${format(
                                  new Date(new Date(surgery.date).getTime() + surgery.estimatedDuration * 60000),
                                  "h:mm a",
                                )}`
                              : ""}
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
            <TabsContent value="resources">
              <div className="p-4 text-center">Funcionalidad de gestión de recursos próximamente</div>
            </TabsContent>
            <TabsContent value="reports">
              <div className="p-4 text-center">Funcionalidad de informes próximamente</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {isBookingDialogOpen && userData && (
        <SurgeryBookingDialog
          isOpen={isBookingDialogOpen}
          onClose={() => setIsBookingDialogOpen(false)}
          onComplete={handleBookingComplete}
          selectedSlot={selectedSlot}
          userData={userData}
          hospitalId={selectedHospitalId}
          hospitalName={selectedHospitalName}
        />
      )}
    </div>
  )
}

