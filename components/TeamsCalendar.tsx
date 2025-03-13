"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Calendar, Views, momentLocalizer, type View } from "react-big-calendar"
import moment from "moment"
import "moment/locale/es"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

// Set up the localizer
moment.locale("es")
const localizer = momentLocalizer(moment)

interface Event {
  id: string
  title: string
  start: Date
  end: Date
  attendees?: string[]
  type?: "surgery" | "shift"
  status?: "scheduled" | "cancelled" | "completed"
  color?: string
  neurophysiologists?: Array<{ id: string; name: string }>
  patientName?: string
  booked?: boolean
  style?: React.CSSProperties
  shiftIds?: string[] // Add this to pass shift IDs when clicked
}

interface TeamsCalendarProps {
  events: Event[]
  onEventClick: (event: Event) => void
  onSlotClick: (slotInfo: Date) => void
  onNewMeeting: () => void
  onShiftClick?: (start: Date, end: Date, shiftIds?: string[]) => void
  onNavigate?: (date: Date, view: View) => void
  userRole?: string
  actualUserRole?: string
  showNewSurgeryButton?: boolean
  initialDate?: Date
  initialView?: View
}

export function TeamsCalendar({
  events,
  onEventClick,
  onSlotClick,
  onNewMeeting,
  onShiftClick,
  onNavigate,
  userRole = "cirujano",
  actualUserRole,
  showNewSurgeryButton = true,
  initialDate = new Date(),
  initialView = Views.WEEK,
}: TeamsCalendarProps) {
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [view, setView] = useState<View>(initialView)
  const [currentDate, setCurrentDate] = useState(initialDate)

  useEffect(() => {
    const transformedEvents = events.map((event) => ({
      ...event,
      title: event.title,
      style: {
        backgroundColor:
          event.type === "surgery"
            ? event.status === "cancelled"
              ? "#FDA4AF"
              : "#93C5FD"
            : event.booked
              ? "#D1D5DB"
              : "#86EFAC",
        borderRadius: "4px",
        color: "#1F2937",
        border: "none",
      },
    }))

    setCalendarEvents(transformedEvents)
  }, [events])

  // Update currentDate when initialDate changes
  useEffect(() => {
    setCurrentDate(initialDate)
  }, [initialDate])

  const handleEventClick = (event: Event) => {
    // If it's an available shift, handle it differently
    if (event.type === "shift" && !event.booked && onShiftClick) {
      onShiftClick(event.start, event.end, event.shiftIds)
    } else {
      onEventClick(event)
    }
  }

  const handleSlotClick = (slotInfo: any) => {
    console.log("TeamsCalendar slot clicked:", {
      date: slotInfo.start.toISOString(),
      year: slotInfo.start.getFullYear(),
      month: slotInfo.start.getMonth(),
      day: slotInfo.start.getDate(),
      hours: slotInfo.start.getHours(),
      minutes: slotInfo.start.getMinutes(),
    })

    // Create a new Date object to avoid reference issues
    const clickedDate = new Date(
      slotInfo.start.getFullYear(),
      slotInfo.start.getMonth(),
      slotInfo.start.getDate(),
      slotInfo.start.getHours(),
      slotInfo.start.getMinutes(),
    )

    console.log("TeamsCalendar created new Date object:", {
      date: clickedDate.toISOString(),
      year: clickedDate.getFullYear(),
      month: clickedDate.getMonth(),
      day: clickedDate.getDate(),
      hours: clickedDate.getHours(),
      minutes: clickedDate.getMinutes(),
    })

    onSlotClick(clickedDate)
  }

  const shouldShowButton =
    showNewSurgeryButton &&
    (actualUserRole === "cirujano" || actualUserRole === "administrativo" || actualUserRole === "jefe_departamento")

  // Handle view change
  const handleViewChange = (newView: View) => {
    setView(newView)
    if (onNavigate) {
      onNavigate(currentDate, newView)
    }
  }

  // Handle date navigation
  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate)
    if (onNavigate) {
      onNavigate(newDate, view)
    }
  }

  return (
    <div className="h-[600px] flex flex-col">
      {shouldShowButton && (
        <div className="mb-4 flex justify-end">
          <Button onClick={onNewMeeting} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Cirugía</span>
          </Button>
        </div>
      )}
      <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          view={view}
          date={currentDate}
          onView={handleViewChange}
          onNavigate={handleNavigate}
          onSelectEvent={handleEventClick}
          onSelectSlot={handleSlotClick}
          selectable
          popup
          eventPropGetter={(event: any) => ({
            style: event.style,
          })}
          formats={{
            dayHeaderFormat: (date: Date) => moment(date).format("dddd, D [de] MMMM"),
            dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
              `${moment(start).format("D [de] MMMM")} - ${moment(end).format("D [de] MMMM")}`,
            monthHeaderFormat: (date: Date) => moment(date).format("MMMM YYYY"),
          }}
          messages={{
            today: "Hoy",
            previous: "Anterior",
            next: "Siguiente",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "No hay eventos en este rango",
            showMore: (total) => `+ Ver ${total} más`,
          }}
          components={{
            event: (props) => {
              const { event } = props
              return (
                <div className="p-1 overflow-hidden">
                  <div className="font-medium text-xs truncate">{event.title}</div>
                  {event.patientName && view !== Views.MONTH && (
                    <div className="text-xs truncate">Paciente: {event.patientName}</div>
                  )}
                  {event.neurophysiologists && event.neurophysiologists.length > 0 && view !== Views.MONTH && (
                    <div className="text-xs truncate">
                      Neurofisiólogos: {event.neurophysiologists.map((n) => n.name).join(", ")}
                    </div>
                  )}
                </div>
              )
            },
          }}
        />
      </div>
    </div>
  )
}

