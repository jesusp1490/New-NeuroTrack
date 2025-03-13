"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Calendar, Views, momentLocalizer } from "react-big-calendar"
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
}

interface TeamsCalendarProps {
  events: Event[]
  onEventClick: (event: Event) => void
  onSlotClick: (slotInfo: Date) => void
  onNewMeeting: () => void
  userRole?: string
  actualUserRole?: string
  showNewSurgeryButton?: boolean // Add this prop to control button visibility from parent
}

export function TeamsCalendar({
  events,
  onEventClick,
  onSlotClick,
  onNewMeeting,
  userRole = "cirujano",
  actualUserRole,
  showNewSurgeryButton = true, // Default to true but let parent override
}: TeamsCalendarProps) {
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])

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

  const handleEventClick = (event: Event) => {
    onEventClick(event)
  }

  const handleSlotClick = (slotInfo: any) => {
    onSlotClick(slotInfo.start)
  }

  // Only show the button if explicitly allowed by parent and user has correct role
  const shouldShowButton =
    showNewSurgeryButton &&
    (actualUserRole === "cirujano" || actualUserRole === "administrativo" || actualUserRole === "jefe_departamento")

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
          views={[Views.WEEK, Views.DAY]}
          defaultView={Views.WEEK}
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
          }}
          components={{
            event: (props) => {
              const { event } = props
              return (
                <div className="p-1 overflow-hidden">
                  <div className="font-medium text-xs truncate">{event.title}</div>
                  {event.patientName && <div className="text-xs truncate">Paciente: {event.patientName}</div>}
                  {event.neurophysiologists && event.neurophysiologists.length > 0 && (
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

