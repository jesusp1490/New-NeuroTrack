"use client"
import { useState, useEffect, useCallback } from "react"
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Shift, Surgery } from "@/types"
import { TeamsCalendar } from "./TeamsCalendar"
import { SlotInfo } from "./SurgeryBookingDialog"

interface Props {
  hospitalId: string
  hospitalName: string
  onSelectSlot: (slotInfo: SlotInfo) => void
  onBookSurgery: () => void
  refreshTrigger?: number
  userRole?: string
  userId?: string
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  attendees?: string[]
  type?: "surgery" | "shift"
  status?: "scheduled" | "cancelled" | "completed"
  color?: string
  neurophysiologistId?: string
  neurophysiologistName?: string
  surgeryType?: string
  patientName?: string
  booked?: boolean
}

export default function OperatingRoomCalendar({
  hospitalId,
  hospitalName,
  onSelectSlot,
  onBookSurgery,
  refreshTrigger = 0,
  userRole = "cirujano",
  userId,
}: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    if (!hospitalId) return
    setIsLoading(true)

    try {
      // Fetch surgeries
      const surgeriesRef = collection(db, "surgeries")
      let surgeriesQuery

      if (userRole === "cirujano" && userId) {
        surgeriesQuery = query(surgeriesRef, where("hospitalId", "==", hospitalId), where("surgeonId", "==", userId))
      } else if (userRole === "neurofisiologo" && userId) {
        surgeriesQuery = query(
          surgeriesRef,
          where("hospitalId", "==", hospitalId),
          where("neurophysiologistId", "==", userId),
        )
      } else {
        surgeriesQuery = query(surgeriesRef, where("hospitalId", "==", hospitalId))
      }

      const surgeriesSnapshot = await getDocs(surgeriesQuery)
      const surgeryEvents: CalendarEvent[] = []

      for (const docSnapshot of surgeriesSnapshot.docs) {
        const surgery = { id: docSnapshot.id, ...docSnapshot.data() } as Surgery
        const start = new Date(surgery.date)
        const end = new Date(start.getTime() + surgery.estimatedDuration * 60000)

        // Get neurophysiologist name
        let neurophysiologistName = "No asignado"
        if (surgery.neurophysiologistId) {
          try {
            const userDocRef = doc(db, "users", surgery.neurophysiologistId)
            const userDocSnapshot = await getDoc(userDocRef)
            if (userDocSnapshot.exists()) {
              const userData = userDocSnapshot.data()
              neurophysiologistName = userData.name || "No asignado"
            }
          } catch (error) {
            console.error("Error fetching neurophysiologist:", error)
          }
        }

        surgeryEvents.push({
          id: surgery.id,
          title: surgery.surgeryType,
          start,
          end,
          type: "surgery",
          status: surgery.status,
          attendees: [neurophysiologistName],
          patientName: surgery.patientName,
          neurophysiologistId: surgery.neurophysiologistId,
          neurophysiologistName,
        })
      }

      // Fetch shifts
      const shiftsRef = collection(db, "shifts")
      let shiftsQuery

      if (userRole === "neurofisiologo" && userId) {
        shiftsQuery = query(
          shiftsRef,
          where("hospitalId", "==", hospitalId),
          where("neurophysiologistId", "==", userId),
        )
      } else {
        shiftsQuery = query(shiftsRef, where("hospitalId", "==", hospitalId))
      }

      const shiftsSnapshot = await getDocs(shiftsQuery)
      const shiftEvents: CalendarEvent[] = []

      for (const docSnapshot of shiftsSnapshot.docs) {
        const shift = { id: docSnapshot.id, ...docSnapshot.data() } as Shift
        const shiftDate = new Date(shift.date)
        const startHour = shift.type === "morning" ? 8 : 14
        const endHour = shift.type === "morning" ? 14 : 20

        const start = new Date(shiftDate)
        start.setHours(startHour, 0, 0)
        const end = new Date(shiftDate)
        end.setHours(endHour, 0, 0)

        // Get neurophysiologist name
        let neurophysiologistName = "No asignado"
        if (shift.neurophysiologistId) {
          try {
            const userDocRef = doc(db, "users", shift.neurophysiologistId)
            const userDocSnapshot = await getDoc(userDocRef)
            if (userDocSnapshot.exists()) {
              const userData = userDocSnapshot.data()
              neurophysiologistName = userData.name || "No asignado"
            }
          } catch (error) {
            console.error("Error fetching neurophysiologist:", error)
          }
        }

        shiftEvents.push({
          id: `shift-${shift.id}`,
          title: shift.booked ? "Turno Reservado" : "Turno Disponible",
          start,
          end,
          type: "shift",
          attendees: [neurophysiologistName],
          booked: shift.booked,
          neurophysiologistId: shift.neurophysiologistId,
          neurophysiologistName,
        })
      }

      setEvents([...shiftEvents, ...surgeryEvents]) // Put shifts first so surgeries render on top
    } catch (error) {
      console.error("Error fetching events:", error)
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }, [hospitalId, userRole, userId])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents, hospitalId, userRole, userId])

  const handleSlotClick = (date: Date) => {
    // Create a dialog to select duration or end time
    const selectedHour = date.getHours()
    const maxEndHour = selectedHour < 14 ? 14 : 20 // End at 14:00 for morning, 20:00 for afternoon

    // Calculate a default end time (1 hour later, but not past the shift end)
    const defaultEndTime = new Date(date)
    defaultEndTime.setHours(Math.min(date.getHours() + 1, maxEndHour))

    onSelectSlot({
      start: date,
      end: defaultEndTime,
      resourceId: undefined,
      action: "select",
    })
  }

  if (isLoading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <TeamsCalendar
      events={events}
      onEventClick={(event) => console.log("Event clicked:", event)}
      onSlotClick={handleSlotClick}
      onNewMeeting={onBookSurgery}
      userRole={userRole}
    />
  )
}

