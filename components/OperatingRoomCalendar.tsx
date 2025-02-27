"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar, Views, dateFnsLocalizer, type View } from "react-big-calendar"
import format from "date-fns/format"
import parse from "date-fns/parse"
import startOfWeek from "date-fns/startOfWeek"
import getDay from "date-fns/getDay"
import addDays from "date-fns/addDays"
import subDays from "date-fns/subDays"
import es from "date-fns/locale/es"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Shift, Surgery } from "@/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

const locales = {
  es: es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: "surgery" | "shift"
  status?: "scheduled" | "completed" | "cancelled"
}

interface Props {
  hospitalId?: string
  onSelectSlot: (slot: { start: Date; end: Date }) => void
  onBookSurgery: () => void
  refreshTrigger: number
}

export default function OperatingRoomCalendar({ hospitalId, onSelectSlot, onBookSurgery, refreshTrigger }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<View>("week")

  const fetchEvents = useCallback(
    async (date: Date) => {
      if (hospitalId) {
        const startDate = startOfWeek(date)
        const endDate = addDays(startDate, 7)

        // Fetch shifts
        const shiftsRef = collection(db, "shifts")
        const shiftsQuery = query(
          shiftsRef,
          where("hospitalId", "==", hospitalId),
          where("date", ">=", startDate.toISOString().split("T")[0]),
          where("date", "<=", endDate.toISOString().split("T")[0]),
        )
        const shiftsSnapshot = await getDocs(shiftsQuery)
        const shifts = shiftsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Shift[]

        // Fetch surgeries
        const surgeriesRef = collection(db, "surgeries")
        const surgeriesQuery = query(
          surgeriesRef,
          where("hospitalId", "==", hospitalId),
          where("date", ">=", startDate.toISOString()),
          where("date", "<=", endDate.toISOString()),
        )
        const surgeriesSnapshot = await getDocs(surgeriesQuery)
        const surgeries = surgeriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Surgery[]

        // Convert shifts to events
        const shiftEvents = shifts.map((shift) => {
          const shiftDate = new Date(shift.date)
          const startTime = shift.type === "morning" ? 8 : 14 // 8 AM for morning, 2 PM for afternoon
          const endTime = shift.type === "morning" ? 14 : 20 // 2 PM for morning, 8 PM for afternoon
          return {
            id: shift.id,
            title: `Available ${shift.type} shift`,
            start: new Date(shiftDate.setHours(startTime, 0, 0, 0)),
            end: new Date(shiftDate.setHours(endTime, 0, 0, 0)),
            type: "shift" as const,
          }
        })

        // Convert surgeries to events
        const surgeryEvents = surgeries.map((surgery) => ({
          id: surgery.id,
          title: `Surgery: ${surgery.surgeryType}`,
          start: new Date(surgery.date),
          end: new Date(new Date(surgery.date).getTime() + surgery.estimatedDuration * 60000),
          type: "surgery" as const,
          status: surgery.status,
        }))

        setEvents([...shiftEvents, ...surgeryEvents])
      }
    },
    [hospitalId],
  )

  useEffect(() => {
    fetchEvents(currentDate)
  }, [fetchEvents, currentDate])

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    switch (action) {
      case "PREV":
        setCurrentDate(subDays(currentDate, 7))
        break
      case "NEXT":
        setCurrentDate(addDays(currentDate, 7))
        break
      case "TODAY":
        setCurrentDate(new Date())
        break
    }
  }

  const handleViewChange = (newView: View) => {
    setView(newView)
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleNavigate("PREV")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => handleNavigate("TODAY")}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleNavigate("NEXT")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">Surgery Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === "week" ? "default" : "outline"} onClick={() => handleViewChange("week")}>
            Week
          </Button>
          <Button variant={view === "day" ? "default" : "outline"} onClick={() => handleViewChange("day")}>
            Day
          </Button>
          <Button onClick={onBookSurgery}>
            <Plus className="h-4 w-4 mr-2" />
            Book Surgery
          </Button>
        </div>
      </div>
      <div className="h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={["week", "day"]}
          view={view}
          onView={handleViewChange}
          date={currentDate}
          onNavigate={(newDate: Date) => setCurrentDate(newDate)}
          defaultView={Views.WEEK}
          min={new Date(0, 0, 0, 8, 0, 0)} // Start at 8 AM
          max={new Date(0, 0, 0, 20, 0, 0)} // End at 8 PM
          step={60}
          timeslots={1}
          selectable
          onSelectSlot={onSelectSlot}
          eventPropGetter={(event: CalendarEvent) => ({
            className: `rbc-event-${event.type} rbc-event-${event.status || "default"}`,
            style: {
              backgroundColor: event.type === "surgery" ? "#4f46e5" : "#10b981",
              borderColor: event.status === "cancelled" ? "#ef4444" : "transparent",
            },
          })}
          className="bg-white rounded-lg shadow-sm"
        />
      </div>
    </Card>
  )
}

