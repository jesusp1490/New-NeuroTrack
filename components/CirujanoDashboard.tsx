"use client"

import { useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import OperatingRoomCalendar from "./OperatingRoomCalendar"
import { SurgeryBookingDialog } from "./SurgeryBookingDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SlotInfo = {
  start: Date
  end: Date
  resourceId?: string | number
}

export default function CirujanoDashboard() {
  const { userData } = useAuth()
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date; resourceId?: string } | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleOpenBooking = (slotInfo: SlotInfo) => {
    setSelectedSlot({
      start: slotInfo.start,
      end: slotInfo.end,
      resourceId: typeof slotInfo.resourceId === "string" ? slotInfo.resourceId : undefined,
    })
    setIsBookingOpen(true)
  }

  const handleBookSurgery = () => {
    setSelectedSlot(null)
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

  if (!userData?.hospitalId) {
    return <div>Loading user data...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cirujano Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Welcome, Dr. {userData?.name}</p>
          <p className="text-sm text-muted-foreground">Hospital: {userData?.hospitalId}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Surgery Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <OperatingRoomCalendar
            hospitalId={userData.hospitalId}
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

