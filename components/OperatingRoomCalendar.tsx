"use client"
import { useState, useEffect, useCallback } from "react"
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Shift, Surgery } from "@/types"
import { TeamsCalendar } from "./TeamsCalendar"
import { SlotInfo } from "./SurgeryBookingDialog"
import { useAuth } from "@/app/context/AuthContext"
import { getSelectedHospital } from "@/lib/hospitalStorage"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { Views, View } from "react-big-calendar"

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
  neurophysiologists?: Array<{ id: string; name: string }>
  surgeryType?: string
  patientName?: string
  booked?: boolean
  shiftIds?: string[]
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
  const { userData } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<View>(Views.WEEK)

  // Check if user is an admin type that can access all hospitals
  const isAdminUser = userData?.role === "administrativo" || userData?.role === "jefe_departamento"

  // Add a useEffect to check for hospital changes from localStorage
  useEffect(() => {
    // Check if the current hospitalId matches the one in localStorage
    const savedHospital = getSelectedHospital()

    if (savedHospital && savedHospital.id !== hospitalId && isAdminUser) {
      console.log(`Hospital mismatch detected. Current: ${hospitalId}, Saved: ${savedHospital.id}`)
    }
  }, [hospitalId, isAdminUser])

  // Update the fetchEvents function to check localStorage for admin users and handle date ranges
  const fetchEvents = useCallback(
    async (date: Date = new Date(), view: View = Views.WEEK) => {
      if (!hospitalId) {
        console.log("No hospital ID provided, cannot fetch events")
        return
      }

      // For admin users, check if there's a saved hospital in localStorage
      const isAdminUser = userData?.role === "administrativo" || userData?.role === "jefe_departamento"
      const savedHospital = isAdminUser ? getSelectedHospital() : null
      const effectiveHospitalId = isAdminUser && savedHospital ? savedHospital.id : hospitalId

      if (isAdminUser && savedHospital && savedHospital.id !== hospitalId) {
        console.log(`Using saved hospital ID from localStorage: ${savedHospital.id} instead of ${hospitalId}`)
      }

      setIsLoading(true)
      console.log(
        `Fetching events for hospital: ${effectiveHospitalId}, userRole: ${userRole}, userId: ${userId}, date: ${date.toISOString()}, view: ${view}`,
      )

      try {
        // Calculate date range based on view
        let startDate, endDate

        if (view === Views.DAY) {
          startDate = new Date(date)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(date)
          endDate.setHours(23, 59, 59, 999)
        } else if (view === Views.MONTH) {
          // For month view, get the entire month
          startDate = startOfMonth(date)
          endDate = endOfMonth(date)
        } else {
          // Default to week view
          startDate = startOfWeek(date, { weekStartsOn: 1 }) // Start on Monday
          endDate = endOfWeek(date, { weekStartsOn: 1 }) // End on Sunday
        }

        // Format dates for Firestore queries
        const startDateStr = format(startDate, "yyyy-MM-dd")
        const endDateStr = format(endDate, "yyyy-MM-dd")

        console.log(`Date range: ${startDateStr} to ${endDateStr} for view: ${view}`)

        // Fetch surgeries
        const surgeriesRef = collection(db, "surgeries")
        let surgeriesQuery

        if (userRole === "cirujano" && userId) {
          surgeriesQuery = query(
            surgeriesRef,
            where("hospitalId", "==", effectiveHospitalId),
            where("surgeonId", "==", userId),
          )
        } else if (userRole === "neurofisiologo" && userId) {
          surgeriesQuery = query(
            surgeriesRef,
            where("hospitalId", "==", effectiveHospitalId),
            where("neurophysiologistIds", "array-contains", userId),
          )
        } else {
          surgeriesQuery = query(surgeriesRef, where("hospitalId", "==", effectiveHospitalId))
        }

        const surgeriesSnapshot = await getDocs(surgeriesQuery)
        const surgeryEvents: CalendarEvent[] = []

        for (const docSnapshot of surgeriesSnapshot.docs) {
          const surgery = { id: docSnapshot.id, ...docSnapshot.data() } as Surgery
          const surgeryDate = new Date(surgery.date)

          // Filter surgeries by date range
          if (surgeryDate >= startDate && surgeryDate <= endDate) {
            const start = new Date(surgery.date)
            const end = new Date(start.getTime() + surgery.estimatedDuration * 60000)

            // Get neurophysiologist names
            const neurophysiologists: Array<{ id: string; name: string }> = []

            if (surgery.neurophysiologistIds && surgery.neurophysiologistIds.length > 0) {
              for (const neuroId of surgery.neurophysiologistIds) {
                try {
                  const userDocRef = doc(db, "users", neuroId)
                  const userDocSnapshot = await getDoc(userDocRef)
                  if (userDocSnapshot.exists()) {
                    const userData = userDocSnapshot.data()
                    neurophysiologists.push({
                      id: neuroId,
                      name: userData.name || "No asignado",
                    })
                  }
                } catch (error) {
                  console.error("Error fetching neurophysiologist:", error)
                }
              }
            }

            surgeryEvents.push({
              id: surgery.id,
              title: surgery.surgeryType,
              start,
              end,
              type: "surgery",
              status: surgery.status,
              attendees: neurophysiologists.map((n) => n.name),
              patientName: surgery.patientName,
              neurophysiologists: neurophysiologists,
            })
          }
        }

        // Fetch shifts
        const shiftsRef = collection(db, "shifts")
        let shiftsQuery

        if (userRole === "neurofisiologo" && userId) {
          shiftsQuery = query(
            shiftsRef,
            where("hospitalId", "==", effectiveHospitalId),
            where("neurophysiologistId", "==", userId),
            where("date", ">=", startDateStr),
            where("date", "<=", endDateStr),
          )
        } else {
          shiftsQuery = query(
            shiftsRef,
            where("hospitalId", "==", effectiveHospitalId),
            where("date", ">=", startDateStr),
            where("date", "<=", endDateStr),
          )
        }

        const shiftsSnapshot = await getDocs(shiftsQuery)

        // Group shifts by date and type to show multiple neurophysiologists in the same slot
        const shiftGroups: Record<
          string,
          {
            date: string
            type: string
            neurophysiologists: Array<{ id: string; name: string }>
            shiftIds: string[]
            booked: boolean
          }
        > = {}

        for (const docSnapshot of shiftsSnapshot.docs) {
          const shift = { id: docSnapshot.id, ...docSnapshot.data() } as Shift

          // Skip booked shifts for the calendar view (they'll be shown as surgeries)
          if (shift.booked && userRole === "cirujano") continue

          const shiftDate = new Date(shift.date)
          const groupKey = `${shift.date}-${shift.type}`

          // Get neurophysiologist name
          let neurophysiologistName = "No asignado"
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

          // Add to or create group
          if (!shiftGroups[groupKey]) {
            shiftGroups[groupKey] = {
              date: shift.date,
              type: shift.type,
              neurophysiologists: [
                {
                  id: shift.neurophysiologistId,
                  name: neurophysiologistName,
                },
              ],
              shiftIds: [shift.id],
              booked: shift.booked,
            }
          } else {
            shiftGroups[groupKey].neurophysiologists.push({
              id: shift.neurophysiologistId,
              name: neurophysiologistName,
            })
            shiftGroups[groupKey].shiftIds.push(shift.id)
            // If any shift in the group is booked, mark the group as booked
            shiftGroups[groupKey].booked = shiftGroups[groupKey].booked || shift.booked
          }
        }

        // Convert shift groups to events
        const shiftEvents: CalendarEvent[] = Object.values(shiftGroups).map((group) => {
          const shiftDate = new Date(group.date)
          const startHour = group.type === "morning" ? 8 : 14
          const endHour = group.type === "morning" ? 14 : 20

          const start = new Date(shiftDate)
          start.setHours(startHour, 0, 0)
          const end = new Date(shiftDate)
          end.setHours(endHour, 0, 0)

          return {
            id: `shift-${group.shiftIds.join("-")}`,
            title: group.booked ? "Turno Reservado" : "Turno Disponible",
            start,
            end,
            type: "shift",
            attendees: group.neurophysiologists.map((n) => n.name),
            booked: group.booked,
            neurophysiologists: group.neurophysiologists,
            shiftIds: group.shiftIds,
          }
        })

        console.log(
          `Fetched ${surgeryEvents.length} surgeries and ${shiftEvents.length} shifts for hospital ${effectiveHospitalId} from ${startDateStr} to ${endDateStr}`,
        )
        setEvents([...shiftEvents, ...surgeryEvents]) // Put shifts first so surgeries render on top
      } catch (error) {
        console.error("Error fetching events:", error)
        setEvents([])
      } finally {
        setIsLoading(false)
      }
    },
    [hospitalId, userRole, userId, userData],
  )

  // Initial fetch on mount and when dependencies change
  useEffect(() => {
    if (hospitalId) {
      console.log(`Hospital ID changed to ${hospitalId}, refreshing events`)
      fetchEvents(currentDate, currentView)
    }
  }, [fetchEvents, hospitalId, refreshTrigger, currentDate, currentView])

  const handleSlotClick = (date: Date) => {
    console.log("OperatingRoomCalendar slot clicked:", {
      date: date.toISOString(),
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hours: date.getHours(),
      minutes: date.getMinutes(),
    })

    // Create a new Date object to avoid reference issues
    const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes())

    console.log("OperatingRoomCalendar created new Date object:", {
      date: slotDate.toISOString(),
      year: slotDate.getFullYear(),
      month: slotDate.getMonth(),
      day: slotDate.getDate(),
      hours: slotDate.getHours(),
      minutes: slotDate.getMinutes(),
    })

    // Create a dialog to select duration or end time
    const selectedHour = slotDate.getHours()
    const maxEndHour = selectedHour < 14 ? 14 : 20 // End at 14:00 for morning, 20:00 for afternoon

    // Calculate a default end time (1 hour later, but not past the shift end)
    const defaultEndTime = new Date(
      slotDate.getFullYear(),
      slotDate.getMonth(),
      slotDate.getDate(),
      Math.min(slotDate.getHours() + 1, maxEndHour),
      slotDate.getMinutes(),
    )

    const slotInfo = {
      start: slotDate,
      end: defaultEndTime,
      resourceId: undefined,
      action: "select",
    }

    console.log("OperatingRoomCalendar passing slot info:", {
      start: slotInfo.start.toISOString(),
      end: slotInfo.end.toISOString(),
    })

    onSelectSlot(slotInfo)
  }

  // New handler for shift clicks
  const handleShiftClick = (start: Date, end: Date, shiftIds?: string[]) => {
    console.log("Shift clicked:", {
      start: start.toISOString(),
      end: end.toISOString(),
      shiftIds,
    })

    // Create new Date objects to avoid reference issues
    const slotStart = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      start.getHours(),
      start.getMinutes(),
    )

    const slotEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes())

    console.log("OperatingRoomCalendar created new Date objects for shift:", {
      start: slotStart.toISOString(),
      end: slotEnd.toISOString(),
    })

    onSelectSlot({
      start: slotStart,
      end: slotEnd,
      resourceId: undefined,
      action: "select",
      shiftIds, // Pass the shift IDs to the booking dialog
    })
  }

  // Handle calendar navigation
  const handleNavigate = (date: Date, view: View) => {
    console.log(`Calendar navigated to: ${date.toISOString()}, view: ${view}`)
    setCurrentDate(date)
    setCurrentView(view)
    fetchEvents(date, view)
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
      onShiftClick={handleShiftClick}
      onNewMeeting={onBookSurgery}
      onNavigate={handleNavigate}
      userRole={userRole}
      actualUserRole={userData?.role}
      showNewSurgeryButton={false}
      initialDate={currentDate}
      initialView={currentView}
    />
  )
}

