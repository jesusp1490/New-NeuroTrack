"use client"

import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import React, { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

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

const getEventsForDateAndHour = (date: Date, hour: number, events: CalendarEvent[]) => {
  return events.filter((event) => {
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)
    const slotStart = new Date(date)
    slotStart.setHours(hour, 0, 0, 0)
    const slotEnd = new Date(date)
    slotEnd.setHours(hour + 1, 0, 0, 0)

    // Check if the event overlaps with this time slot
    return (
      eventStart.getDate() === date.getDate() &&
      eventStart.getMonth() === date.getMonth() &&
      eventStart < slotEnd &&
      eventEnd > slotStart
    )
  })
}

const getEventStyle = (event: CalendarEvent) => {
  const baseStyle =
    "absolute left-0 right-0 rounded-sm p-1 text-xs break-words overflow-hidden cursor-pointer transition-colors"

  let statusStyle = "bg-indigo-100 hover:bg-indigo-200 text-indigo-900 z-10"
  if (event.status === "cancelled") {
    statusStyle = "bg-red-100 hover:bg-red-200 text-red-900 z-10"
  } else if (event.status === "completed") {
    statusStyle = "bg-blue-100 hover:bg-blue-200 text-blue-900 z-10"
  } else if (event.type === "shift" && !event.booked) {
    statusStyle = "bg-green-100 hover:bg-green-200 text-green-900"
  } else if (event.type === "shift" && event.booked) {
    statusStyle = "bg-yellow-100 hover:bg-yellow-200 text-yellow-900"
  }

  return `${baseStyle} ${statusStyle}`
}

interface Props {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onSlotClick?: (date: Date) => void
  onNewMeeting?: () => void
  userRole?: string
}

export const TeamsCalendar = ({ events, onEventClick, onSlotClick, onNewMeeting, userRole = "cirujano" }: Props) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1))
  }

  const goToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Generate week days based on current date
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    return { date }
  })

  const CELL_HEIGHT = 64 // This matches our h-16 class (16 * 4 = 64px)
  const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8am to 8pm

  const calculateEventStyle = (event: CalendarEvent, hour: number) => {
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)

    // For shifts, calculate the full height based on shift type
    if (event.type === "shift") {
      const isMorningShift = eventStart.getHours() === 8
      const isAfternoonShift = eventStart.getHours() === 14

      if ((isMorningShift && hour === 8) || (isAfternoonShift && hour === 14)) {
        const heightInHours = 6 // Both morning and afternoon shifts are 6 hours
        return {
          top: 0,
          height: `${heightInHours * CELL_HEIGHT}px`,
          zIndex: 5,
        }
      }
      return null
    }

    // For surgeries, calculate precise positioning
    if (eventStart.getHours() === hour) {
      const durationInHours = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60)
      const minuteOffset = eventStart.getMinutes()
      const topOffset = (minuteOffset / 60) * CELL_HEIGHT

      return {
        top: `${topOffset}px`,
        height: `${durationInHours * CELL_HEIGHT}px`,
        zIndex: 10,
      }
    }

    return null
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Calendar header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium">
            {format(startOfWeek(currentDate, { weekStartsOn: 0 }), "d MMM")} -{" "}
            {format(endOfWeek(currentDate, { weekStartsOn: 0 }), "d MMM yyyy")}
          </h3>
        </div>
        {userRole !== "neurofisiologo" && onNewMeeting && (
          <Button onClick={onNewMeeting} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Reservar Cirugía
          </Button>
        )}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-8 border border-gray-200 rounded-md overflow-hidden">
        {/* Header row for days of the week */}
        <div className="col-span-1 bg-gray-100"></div>
        <div className="col-span-7 grid grid-cols-7 bg-gray-100">
          {weekDays.map((day) => (
            <div key={day.date.toISOString()} className="text-center py-2 font-medium">
              <div>{format(day.date, "EEE")}</div>
              <div
                className={`text-sm ${format(day.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "bg-blue-100 rounded-full w-7 h-7 flex items-center justify-center mx-auto" : ""}`}
              >
                {format(day.date, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        {HOURS.map((hour) => (
          <React.Fragment key={hour}>
            {/* Time label */}
            <div className="p-2 border-b border-r text-sm text-gray-500 flex items-center justify-end pr-4">
              {format(new Date().setHours(hour, 0), "HH:mm")}
            </div>

            {/* Time slots for each day */}
            <div className="col-span-7 grid grid-cols-7">
              {weekDays.map((day) => {
                const slotEvents = getEventsForDateAndHour(day.date, hour, events)
                return (
                  <div
                    key={`${day.date.toISOString()}-${hour}`}
                    className="border-b border-r last:border-r-0 relative h-16"
                    onClick={() => {
                      const date = new Date(day.date)
                      date.setHours(hour)
                      onSlotClick?.(date)
                    }}
                  >
                    {slotEvents.map((event) => {
                      const style = calculateEventStyle(event, hour)
                      if (!style) return null

                      return (
                        <TooltipProvider key={event.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={getEventStyle(event)}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEventClick?.(event)
                                }}
                                style={style}
                              >
                                <div className="font-medium truncate">
                                  {event.type === "shift"
                                    ? event.booked
                                      ? "Turno Reservado"
                                      : "Turno Disponible"
                                    : event.title}
                                </div>
                                {event.neurophysiologistName && (
                                  <div className="text-xs opacity-75 truncate">{event.neurophysiologistName}</div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="p-2">
                                <p className="font-bold">
                                  {event.type === "shift"
                                    ? event.booked
                                      ? "Turno Reservado"
                                      : "Turno Disponible"
                                    : event.title}
                                </p>
                                <p className="text-sm">
                                  {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                                </p>
                                {event.neurophysiologistName && (
                                  <p className="text-sm">Neurofisiólogo: {event.neurophysiologistName}</p>
                                )}
                                {event.type === "shift" && (
                                  <p className="text-sm">
                                    {event.booked ? "Este turno ya está reservado" : "Disponible para reservar cirugía"}
                                  </p>
                                )}
                                {event.status && <p className="text-sm capitalize">Estado: {event.status}</p>}
                                {event.patientName && <p className="text-sm">Paciente: {event.patientName}</p>}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

