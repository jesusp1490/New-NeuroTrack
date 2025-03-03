"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { Calendar, Views, dateFnsLocalizer, View, SlotInfo } from "react-big-calendar"
import format from "date-fns/format"
import parse from "date-fns/parse"
import startOfWeek from "date-fns/startOfWeek"
import getDay from "date-fns/getDay"
import addDays from "date-fns/addDays"
import subDays from "date-fns/subDays"
import es from "date-fns/locale/es"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Shift, Surgery, Room } from "@/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  type: "shift" | "surgery"
  resourceId?: string
  neurophysiologistId?: string
  neurophysiologistName?: string
  surgeryType?: string
  status?: "scheduled" | "completed" | "cancelled"
  booked?: boolean
}

interface Props {
  hospitalId: string
  onSelectSlot: (slotInfo: SlotInfo) => void
  onBookSurgery: () => void
  refreshTrigger: number
}

export default function OperatingRoomCalendar({ hospitalId, onSelectSlot, onBookSurgery, refreshTrigger }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<View>("week")

  const fetchEvents = useCallback(
    async (date: Date) => {
      if (!hospitalId) return

      const startDate = startOfWeek(date)
      const endDate = addDays(startDate, 7)

      // Fetch rooms
      const roomsRef = collection(db, "rooms")
      const roomsQuery = query(roomsRef, where("hospitalId", "==", hospitalId))
      const roomsSnapshot = await getDocs(roomsQuery)
      let fetchedRooms = roomsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Room)

      if (fetchedRooms.length === 0) {
        fetchedRooms = [{ id: hospitalId, name: "Default Room", hospitalId: hospitalId }]
      }
      setRooms(fetchedRooms)

      // Fetch shifts
      const shiftsRef = collection(db, "shifts")
      const shiftsQuery = query(
        shiftsRef,
        where("hospitalId", "==", hospitalId),
        where("date", ">=", format(startDate, "yyyy-MM-dd")),
        where("date", "<=", format(endDate, "yyyy-MM-dd")),
      )
      const shiftsSnapshot = await getDocs(shiftsQuery)
      const shifts = shiftsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Shift)

      // Fetch surgeries
      const surgeriesRef = collection(db, "surgeries")
      const surgeriesQuery = query(
        surgeriesRef,
        where("hospitalId", "==", hospitalId),
        where("date", ">=", startDate.toISOString()),
        where("date", "<=", endDate.toISOString()),
      )
      const surgeriesSnapshot = await getDocs(surgeriesQuery)
      const surgeries = surgeriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Surgery)

      // Convert shifts to events
      const shiftEvents = await Promise.all(
        shifts.map(async (shift) => {
          const shiftDate = new Date(shift.date)
          const startTime = shift.type === "morning" ? 8 : 14
          const endTime = shift.type === "morning" ? 14 : 20

          const userRef = await getDoc(doc(db, "users", shift.neurophysiologistId))
          const neurophysiologistName = userRef.exists() ? userRef.data().name : "Unknown"

          return {
            id: `shift-${shift.id}`,
            title: `${shift.booked ? "Booked" : "Available"}: ${neurophysiologistName}`,
            start: new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate(), startTime, 0, 0),
            end: new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate(), endTime, 0, 0),
            type: "shift" as const,
            resourceId: shift.hospitalId,
            neurophysiologistId: shift.neurophysiologistId,
            neurophysiologistName,
            booked: shift.booked,
          }
        }),
      )

      // Convert surgeries to events
      const surgeryEvents = surgeries.map((surgery) => ({
        id: surgery.id,
        title: `Surgery: ${surgery.surgeryType}`,
        start: new Date(surgery.date),
        end: new Date(new Date(surgery.date).getTime() + surgery.estimatedDuration * 60000),
        type: "surgery" as const,
        resourceId: surgery.roomId,
        surgeryType: surgery.surgeryType,
        status: surgery.status,
      }))

      setEvents([...shiftEvents, ...surgeryEvents])
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

  const eventStyleGetter = (event: CalendarEvent) => {
    const style: React.CSSProperties = {
      borderRadius: "4px",
      opacity: 0.8,
      color: "white",
      border: "0",
      display: "block",
      fontWeight: "bold",
    }

    if (event.type === "shift") {
      style.backgroundColor = event.booked ? "#9CA3AF" : "#10b981"
    } else if (event.type === "surgery") {
      style.backgroundColor = "#4f46e5"
    }

    if (event.status === "cancelled") {
      style.backgroundColor = "#ef4444"
      style.textDecoration = "line-through"
    }

    return {
      style: style,
    }
  }

  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-full w-full p-1">
            {event.type === "shift" ? (
              <div className={`text-xs ${event.booked ? "bg-gray-400" : "bg-green-500"} p-1 rounded`}>
                {event.booked ? "Booked" : "Available"}: {event.neurophysiologistName}
              </div>
            ) : (
              <div className="text-xs bg-blue-600 p-1 rounded">Surgery: {event.surgeryType}</div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {event.type === "shift" ? (
            <div>
              <p>
                <strong>{event.booked ? "Booked" : "Available"} Shift</strong>
              </p>
              <p>Neurophysiologist: {event.neurophysiologistName}</p>
              <p>
                Time: {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
              </p>
            </div>
          ) : (
            <div>
              <p>
                <strong>Surgery: {event.surgeryType}</strong>
              </p>
              <p>Status: {event.status}</p>
              <p>
                Time: {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
              </p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

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
          min={new Date(0, 0, 0, 0, 0, 0)}
          max={new Date(0, 0, 0, 23, 59, 59)}
          step={30}
          timeslots={2}
          selectable
          onSelectSlot={onSelectSlot}
          resources={rooms}
          resourceIdAccessor="id"
          resourceTitleAccessor="name"
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
          }}
          className="bg-white rounded-lg shadow-sm"
        />
      </div>
    </Card>
  )
}

