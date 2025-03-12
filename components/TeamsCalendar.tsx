"use client"

import { useState, useRef } from "react"
import { Calendar, momentLocalizer, Views } from "react-big-calendar"
import moment from "moment"
import "moment/locale/es"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

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
  booked?: boolean
  neurophysiologists?: Array<{ id: string; name: string }>
}

interface TeamsCalendarProps {
  events: Event[]
  onEventClick: (event: Event) => void
  onSlotClick: (date: Date) => void
  onNewMeeting: () => void
  userRole?: string
}

export function TeamsCalendar({ events, onEventClick, onSlotClick, onNewMeeting, userRole }: TeamsCalendarProps) {
  const [view, setView] = useState(Views.WEEK)
  const [date, setDate] = useState(new Date())
  const calendarRef = useRef<HTMLDivElement>(null)

  // Custom event styling
  const eventStyleGetter = (event: Event) => {
    let backgroundColor = "#3174ad" // Default blue
    const textColor = "white"
    let borderColor = "#2c6aa0"

    if (event.type === "shift") {
      if (event.booked) {
        backgroundColor = "#9CA3AF" // Gray for booked shifts
        borderColor = "#6B7280"
      } else {
        backgroundColor = "#10B981" // Green for available shifts
        borderColor = "#059669"
      }
    } else if (event.type === "surgery") {
      if (event.status === "cancelled") {
        backgroundColor = "#EF4444" // Red for cancelled
        borderColor = "#DC2626"
      } else if (event.status === "completed") {
        backgroundColor = "#6366F1" // Indigo for completed
        borderColor = "#4F46E5"
      }
    }

    return {
      style: {
        backgroundColor,
        color: textColor,
        borderColor,
        borderRadius: "4px",
        opacity: 1,
        display: "block",
        padding: "2px 5px",
      },
    }
  }

  // Custom toolbar to match Teams style
  const CustomToolbar = ({ label, onNavigate, onView }: any) => {
    return (
      <div className="flex justify-between items-center mb-4 p-2">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => onNavigate("TODAY")}>
            Hoy
          </Button>
          <Button variant="ghost" onClick={() => onNavigate("PREV")}>
            &lt;
          </Button>
          <Button variant="ghost" onClick={() => onNavigate("NEXT")}>
            &gt;
          </Button>
          <span className="text-lg font-medium">{label}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => onView("day")}>
            Día
          </Button>
          <Button variant="outline" onClick={() => onView("week")}>
            Semana
          </Button>
          <Button variant="outline" onClick={() => onView("month")}>
            Mes
          </Button>
          {/* Only show the button for cirujano, jefe_departamento, and administrativo roles */}
          {(userRole === "cirujano" || userRole === "jefe_departamento" || userRole === "administrativo") && (
            <Button onClick={onNewMeeting} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Programar Cirugía
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Format event titles to include attendees
  const formats = {
    eventTimeRangeFormat: () => {
      return ""
    },
  }

  return (
    <div ref={calendarRef} className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        views={["month", "week", "day"]}
        defaultView={Views.WEEK}
        view={view}
        date={date}
        onView={(newView) => setView(newView as any)}
        onNavigate={(newDate) => setDate(newDate)}
        selectable
        onSelectEvent={(event) => onEventClick(event)}
        onSelectSlot={({ start }) => onSlotClick(start as Date)}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar,
        }}
        formats={formats}
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
        min={new Date(new Date().setHours(8, 0, 0))}
        max={new Date(new Date().setHours(20, 0, 0))}
      />
    </div>
  )
}

