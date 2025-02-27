"use client"

import { useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import OperatingRoomCalendar from "./OperatingRoomCalendar"
import { SurgeryBookingDialog } from "./SurgeryBookingDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CirujanoDashboard() {
  const { userData } = useAuth()
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleOpenBooking = (slot: { start: Date; end: Date }) => {
    setSelectedSlot(slot)
    setIsBookingOpen(true)
  }

  const handleBookSurgery = () => {
    setSelectedSlot({ start: new Date(), end: new Date() })
    setIsBookingOpen(true)
  }

  const handleCloseBooking = () => {
    setIsBookingOpen(false)
    setSelectedSlot(null)
  }

  const handleBookingComplete = (event: any) => {
    console.log("Booking completed:", event)
    setIsBookingOpen(false)
    setSelectedSlot(null)
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cirujano Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Welcome, Dr. {userData?.name}</p>
          <p className="text-sm text-muted-foreground">Hospital ID: {userData?.hospitalId}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Surgery Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <OperatingRoomCalendar
            hospitalId={userData?.hospitalId}
            onSelectSlot={handleOpenBooking}
            onBookSurgery={handleBookSurgery}
            refreshTrigger={refreshTrigger}
          />
        </CardContent>
      </Card>
      <SurgeryBookingDialog
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        onComplete={handleBookingComplete}
        selectedSlot={selectedSlot}
        userData={userData}
      />
    </div>
  )
}

