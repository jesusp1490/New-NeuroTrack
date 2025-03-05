"use client"

import { useState } from "react"
import OperatingRoomCalendar from "./OperatingRoomCalendar"
import SurgeryBookingDialog, { type SlotInfo } from "./SurgeryBookingDialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/app/context/AuthContext"

interface JefeDepartamentoDashboardProps {
  hospitalId: string
  hospitalName: string
}

export default function JefeDepartamentoDashboard({ hospitalId, hospitalName }: JefeDepartamentoDashboardProps) {
  const { userData } = useAuth()
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo)
    setIsBookingDialogOpen(true)
  }

  const handleBookSurgery = () => {
    setSelectedSlot(null)
    setIsBookingDialogOpen(true)
  }

  const handleBookingComplete = () => {
    setIsBookingDialogOpen(false)
    setSelectedSlot(null)
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Panel de Jefe de Departamento</CardTitle>
          <CardDescription>Gestionar cirugías, turnos y recursos del departamento</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calendar">
            <TabsList className="mb-4">
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
              <TabsTrigger value="reports">Informes</TabsTrigger>
              <TabsTrigger value="staff">Gestión de Personal</TabsTrigger>
            </TabsList>
            <TabsContent value="calendar">
              <OperatingRoomCalendar
                hospitalId={hospitalId}
                hospitalName={hospitalName}
                onSelectSlot={handleSelectSlot}
                onBookSurgery={handleBookSurgery}
                refreshTrigger={refreshTrigger}
              />
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

      {isBookingDialogOpen && (
        <SurgeryBookingDialog
          isOpen={isBookingDialogOpen}
          onClose={() => setIsBookingDialogOpen(false)}
          onComplete={handleBookingComplete}
          selectedSlot={selectedSlot}
          hospitalId={hospitalId}
          hospitalName={hospitalName}
        />
      )}
    </div>
  )
}

