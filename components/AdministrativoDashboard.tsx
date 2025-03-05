"use client"

import { useState } from "react"
import OperatingRoomCalendar from "./OperatingRoomCalendar"
import SurgeryBookingDialog, { type SlotInfo } from "./SurgeryBookingDialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/app/context/AuthContext"

interface AdministrativoDashboardProps {
  hospitalId: string
  hospitalName: string
}

export default function AdministrativoDashboard({ hospitalId, hospitalName }: AdministrativoDashboardProps) {
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
          <CardTitle>Panel Administrativo</CardTitle>
          <CardDescription>Gestionar recursos hospitalarios y tareas administrativas</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calendar">
            <TabsList className="mb-4">
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
              <TabsTrigger value="resources">Recursos</TabsTrigger>
              <TabsTrigger value="reports">Informes</TabsTrigger>
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
            <TabsContent value="resources">
              <div className="p-4 text-center">Funcionalidad de gestión de recursos próximamente</div>
            </TabsContent>
            <TabsContent value="reports">
              <div className="p-4 text-center">Funcionalidad de informes próximamente</div>
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

