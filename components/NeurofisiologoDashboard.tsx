"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/app/context/AuthContext"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, Plus, X, FileText, Download, LogOut, User } from "lucide-react"
import OperatingRoomCalendar from "./OperatingRoomCalendar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SlotInfo } from "./SurgeryBookingDialog"
import { jsPDF } from "jspdf"
import { useRouter } from "next/navigation"

interface NeurofisiologoDashboardProps {
  hospitalId: string
  hospitalName: string
}

export default function NeurofisiologoDashboard({ hospitalId, hospitalName }: NeurofisiologoDashboardProps) {
  const { userData, logout } = useAuth()
  const router = useRouter()
  const [upcomingSurgeries, setUpcomingSurgeries] = useState<
    Array<{
      id: string
      date: string
      surgeryType: string
      patientName: string
      estimatedDuration: number
      status: string
      surgeonId?: string
      surgeonName?: string
      materials?: Array<{ id: string; name: string; quantity: number; ref?: string }>
      notes?: string
      roomId?: string
      roomName?: string
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("calendar")
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false)
  const [shiftDate, setShiftDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [shiftType, setShiftType] = useState<"morning" | "afternoon">("morning")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [myShifts, setMyShifts] = useState<
    Array<{
      id: string
      neurophysiologistId: string
      hospitalId: string
      date: string
      type: "morning" | "afternoon"
      booked: boolean
      createdAt: string
      updatedAt: string
    }>
  >([])
  const [selectedSurgery, setSelectedSurgery] = useState<string | null>(null)
  const pdfRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  useEffect(() => {
    const fetchUpcomingSurgeries = async () => {
      if (!userData?.id || !hospitalId) {
        console.log("Missing userData.id or hospitalId, skipping fetch")
        return
      }

      setLoading(true)
      try {
        console.log(`Fetching surgeries for neurophysiologist: ${userData.id} at hospital: ${hospitalId}`)
        const now = new Date()
        const surgeriesRef = collection(db, "surgeries")

        // First, try to find surgeries with the new array-based structure
        const q = query(
          surgeriesRef,
          where("neurophysiologistIds", "array-contains", userData.id),
          where("hospitalId", "==", hospitalId),
          where("status", "==", "scheduled"),
        )

        // Get surgeries with the new structure
        const querySnapshot = await getDocs(q)
        console.log(`Found ${querySnapshot.size} surgeries with neurophysiologistIds array`)

        const surgeries = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const surgeryData = docSnapshot.data()
            console.log(`Processing surgery: ${docSnapshot.id}`, surgeryData)

            // Get surgeon name if surgeonId exists
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

            // Get room name if roomId exists
            let roomName = "Sala no especificada"
            if (surgeryData.roomId) {
              try {
                const roomDoc = await getDoc(doc(db, "rooms", surgeryData.roomId))
                if (roomDoc.exists()) {
                  roomName = roomDoc.data().name
                }
              } catch (error) {
                console.error("Error fetching room data:", error)
              }
            }

            return {
              id: docSnapshot.id,
              date: surgeryData.date,
              surgeryType: surgeryData.surgeryType || surgeryData.type || "Tipo no especificado",
              patientName: surgeryData.patientName || "Paciente no especificado",
              estimatedDuration: surgeryData.estimatedDuration || 60,
              status: surgeryData.status || "scheduled",
              surgeonId: surgeryData.surgeonId,
              surgeonName,
              materials: surgeryData.materials,
              notes: surgeryData.notes,
              roomId: surgeryData.roomId,
              roomName,
            }
          }),
        )

        // Also check for surgeries with the old structure (single neurophysiologistId)
        const qOld = query(
          surgeriesRef,
          where("neurophysiologistId", "==", userData.id),
          where("hospitalId", "==", hospitalId),
          where("status", "==", "scheduled"),
        )

        const oldQuerySnapshot = await getDocs(qOld)
        console.log(`Found ${oldQuerySnapshot.size} surgeries with old neurophysiologistId field`)

        const oldSurgeries = await Promise.all(
          oldQuerySnapshot.docs.map(async (docSnapshot) => {
            const surgeryData = docSnapshot.data()
            console.log(`Processing old surgery: ${docSnapshot.id}`, surgeryData)

            // Get surgeon name if surgeonId exists
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

            // Get room name if roomId exists
            let roomName = "Sala no especificada"
            if (surgeryData.roomId) {
              try {
                const roomDoc = await getDoc(doc(db, "rooms", surgeryData.roomId))
                if (roomDoc.exists()) {
                  roomName = roomDoc.data().name
                }
              } catch (error) {
                console.error("Error fetching room data:", error)
              }
            }

            return {
              id: docSnapshot.id,
              date: surgeryData.date,
              surgeryType: surgeryData.surgeryType || surgeryData.type || "Tipo no especificado",
              patientName: surgeryData.patientName || "Paciente no especificado",
              estimatedDuration: surgeryData.estimatedDuration || 60,
              status: surgeryData.status || "scheduled",
              surgeonId: surgeryData.surgeonId,
              surgeonName,
              materials: surgeryData.materials,
              notes: surgeryData.notes,
              roomId: surgeryData.roomId,
              roomName,
            }
          }),
        )

        // Combine both result sets, avoiding duplicates
        const surgeryIds = new Set(surgeries.map((s) => s.id))
        for (const surgery of oldSurgeries) {
          if (!surgeryIds.has(surgery.id)) {
            surgeries.push(surgery)
          }
        }

        // Ordenar por fecha (de más reciente a más antigua)
        surgeries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        console.log(`Total surgeries after combining: ${surgeries.length}`)
        setUpcomingSurgeries(surgeries)
      } catch (error) {
        console.error("Error al obtener cirugías:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchMyShifts = async () => {
      if (!userData?.id || !hospitalId) return

      try {
        const now = new Date()
        const startDate = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")
        const endDate = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")

        const shiftsRef = collection(db, "shifts")
        const q = query(
          shiftsRef,
          where("neurophysiologistId", "==", userData.id),
          where("hospitalId", "==", hospitalId), // Ensure this filter is applied
          where("date", ">=", startDate),
        )

        const querySnapshot = await getDocs(q)
        const shifts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Array<{
          id: string
          neurophysiologistId: string
          hospitalId: string
          date: string
          type: "morning" | "afternoon"
          booked: boolean
          createdAt: string
          updatedAt: string
        }>

        setMyShifts(shifts)
      } catch (error) {
        console.error("Error al obtener turnos:", error)
      }
    }

    fetchUpcomingSurgeries()
    fetchMyShifts()
  }, [userData?.id, hospitalId, refreshTrigger])

  const handleAddShift = async () => {
    if (!userData?.id || !hospitalId) return

    setIsSubmitting(true)
    setError("")

    try {
      // Verificar si ya existe un turno para esta fecha y tipo
      const shiftsRef = collection(db, "shifts")
      const q = query(
        shiftsRef,
        where("neurophysiologistId", "==", userData.id),
        where("hospitalId", "==", hospitalId),
        where("date", "==", shiftDate),
        where("type", "==", shiftType),
      )

      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        throw new Error("Ya tienes un turno registrado para esta fecha y horario")
      }

      // Crear nuevo turno
      await addDoc(collection(db, "shifts"), {
        neurophysiologistId: userData.id,
        hospitalId: hospitalId, // Ensure this is explicitly set
        date: shiftDate,
        type: shiftType,
        booked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      setIsAddShiftOpen(false)
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al crear el turno")
      console.error("Error al crear turno:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este turno?")) return

    try {
      await deleteDoc(doc(db, "shifts", shiftId))
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("Error al eliminar turno:", error)
      alert("Error al eliminar el turno")
    }
  }

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    // Para neurofisiólogos, seleccionar un slot abre el diálogo para añadir un turno
    const date = format(slotInfo.start, "yyyy-MM-dd")
    const hour = slotInfo.start.getHours()
    const type = hour < 14 ? "morning" : "afternoon"

    setShiftDate(date)
    setShiftType(type)
    setIsAddShiftOpen(true)
  }

  const generatePDF = (surgery: (typeof upcomingSurgeries)[0]) => {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(20)
    doc.text("Detalles de Cirugía", 105, 20, { align: "center" })

    // Add hospital info
    doc.setFontSize(12)
    doc.text(`Hospital: ${hospitalName}`, 20, 40)

    // Add surgery details
    doc.setFontSize(14)
    doc.text("Información de la Cirugía", 20, 50)

    doc.setFontSize(12)
    doc.text(`Tipo: ${surgery.surgeryType}`, 20, 60)
    doc.text(`Paciente: ${surgery.patientName}`, 20, 70)
    doc.text(`Fecha: ${format(new Date(surgery.date), "d 'de' MMMM 'de' yyyy", { locale: es })}`, 20, 80)
    doc.text(`Hora: ${format(new Date(surgery.date), "HH:mm")}`, 20, 90)
    doc.text(`Duración estimada: ${surgery.estimatedDuration} minutos`, 20, 100)
    doc.text(`Sala: ${surgery.roomName || "No especificada"}`, 20, 110)

    // Add materials if available - without autoTable
    if (surgery.materials && surgery.materials.length > 0) {
      doc.setFontSize(14)
      doc.text("Materiales Necesarios", 20, 150)

      doc.setFontSize(10)
      doc.text("Material", 20, 160)
      doc.text("Cantidad", 80, 160)
      doc.text("Referencia", 120, 160)

      // Draw a line under the headers
      doc.setDrawColor(200, 200, 200)
      doc.line(20, 162, 180, 162)

      // Add material rows
      let y = 170
      surgery.materials.forEach((material, index) => {
        doc.text(material.name, 20, y)
        doc.text(material.quantity.toString(), 80, y)
        doc.text(material.ref || "N/A", 120, y)
        y += 10
      })
    }

    // Add notes if available
    if (surgery.notes) {
      const notesY = surgery.materials && surgery.materials.length > 0 ? 170 + surgery.materials.length * 10 + 10 : 160

      doc.setFontSize(14)
      doc.text("Notas", 20, notesY)
      doc.setFontSize(12)

      // Split long notes into multiple lines
      const splitNotes = doc.splitTextToSize(surgery.notes, 160)
      doc.text(splitNotes, 20, notesY + 10)
    }

    // Save the PDF
    doc.save(`cirugia_${surgery.id}_${format(new Date(surgery.date), "yyyy-MM-dd")}.pdf`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Panel de Neurofisiólogo - {hospitalName}</CardTitle>
            <CardDescription>Gestiona tus turnos y cirugías programadas</CardDescription>
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
              <TabsTrigger value="shifts">Mis Turnos</TabsTrigger>
              <TabsTrigger value="surgeries">Cirugías Programadas</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setIsAddShiftOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Turno
                </Button>
              </div>
              <OperatingRoomCalendar
                hospitalId={hospitalId}
                hospitalName={hospitalName}
                onSelectSlot={handleSelectSlot}
                onBookSurgery={() => setIsAddShiftOpen(true)}
                refreshTrigger={refreshTrigger}
                userRole="neurofisiologo"
                userId={userData?.id}
              />
            </TabsContent>

            <TabsContent value="shifts">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setIsAddShiftOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Turno
                </Button>
              </div>

              {myShifts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tienes turnos registrados. Añade turnos para que los cirujanos puedan programar cirugías contigo.
                </div>
              ) : (
                <div className="space-y-4">
                  {myShifts.map((shift) => (
                    <Card key={shift.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2 text-indigo-600" />
                            <span className="font-medium">
                              {format(new Date(shift.date), "d 'de' MMMM 'de' yyyy", {
                                locale: es,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 mr-2 text-indigo-600" />
                            <span>{shift.type === "morning" ? "Mañana (8:00 - 14:00)" : "Tarde (14:00 - 20:00)"}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={shift.booked ? "secondary" : "default"}>
                            {shift.booked ? "Reservado" : "Disponible"}
                          </Badge>
                          {!shift.booked && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteShift(shift.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="surgeries">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : upcomingSurgeries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay cirugías programadas próximamente</div>
              ) : (
                <div className="space-y-4">
                  {upcomingSurgeries.map((surgery) => (
                    <Card key={surgery.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{surgery.surgeryType}</h4>
                          <p className="text-sm text-gray-500">Paciente: {surgery.patientName}</p>
                          <p className="text-sm text-gray-500">Cirujano: {surgery.surgeonName || "No especificado"}</p>
                          <p className="text-sm text-gray-500">Sala: {surgery.roomName || "No especificada"}</p>
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
                        <div className="flex flex-col space-y-2">
                          <Badge>
                            {surgery.status === "scheduled"
                              ? "Programada"
                              : surgery.status === "completed"
                                ? "Completada"
                                : surgery.status === "cancelled"
                                  ? "Cancelada"
                                  : "Desconocido"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                            onClick={() => generatePDF(surgery)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            <Download className="h-3 w-3 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog para añadir turno */}
      <Dialog open={isAddShiftOpen} onOpenChange={setIsAddShiftOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Turno</DialogTitle>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shift-date">Fecha</Label>
              <Input id="shift-date" type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift-type">Horario</Label>
              <Select value={shiftType} onValueChange={(value) => setShiftType(value as "morning" | "afternoon")}>
                <SelectTrigger id="shift-type">
                  <SelectValue placeholder="Seleccionar horario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Mañana (8:00 - 14:00)</SelectItem>
                  <SelectItem value="afternoon">Tarde (14:00 - 20:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddShiftOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddShift} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Turno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

