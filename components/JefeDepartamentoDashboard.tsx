"use client"

import { useState } from "react"
import OperatingRoomCalendar from "./OperatingRoomCalendar"
import SurgeryBookingDialog, { SlotInfo } from "./SurgeryBookingDialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/app/context/AuthContext"
import HospitalSelector from "./HospitalSelector"
import { LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface JefeDepartamentoDashboardProps {
  hospitalId: string
  hospitalName: string
}

export default function JefeDepartamentoDashboard({ hospitalId, hospitalName }: JefeDepartamentoDashboardProps) {
  const { userData, logout } = useAuth()
  const router = useRouter()
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | undefined>(undefined)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitalId)
  const [selectedHospitalName, setSelectedHospitalName] = useState(hospitalName)

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

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
            <CardTitle>Panel de Jefe de Departamento</CardTitle>
            <CardDescription>Gestionar cirugías, turnos y recursos del departamento</CardDescription>
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

          <Tabs defaultValue="calendar">
            <TabsList className="mb-4">
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
              <TabsTrigger value="reports">Informes</TabsTrigger>
              <TabsTrigger value="staff">Gestión de Personal</TabsTrigger>
            </TabsList>
            <TabsContent value="calendar">
              {selectedHospitalId !== "all" ? (
                <OperatingRoomCalendar
                  hospitalId={selectedHospitalId}
                  hospitalName={selectedHospitalName}
                  onSelectSlot={handleSelectSlot}
                  onBookSurgery={handleBookSurgery}
                  refreshTrigger={refreshTrigger}
                  userRole="jefe_departamento"
                />
              ) : (
                <div className="p-4 text-center bg-yellow-50 rounded-md border border-yellow-200">
                  Por favor, seleccione un hospital específico para ver el calendario.
                </div>
              )}
            </TabsContent>
            <TabsContent value="reports">
              <div className="p-4 text-center">Funcionalidad de informes próximamente</div>
            </TabsContent>
            <TabsContent value="staff">
              <div className="p-4 text-center">Funcionalidad de gestión de personal próximamente</div>
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

