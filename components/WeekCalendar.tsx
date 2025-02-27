"use client"

import React from "react"
import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"

moment.locale("es")
const localizer = momentLocalizer(moment)

type Event = {
  id: string
  title: string
  start: Date
  end: Date
}

export default function WeekCalendar() {
  const [events, setEvents] = React.useState<Event[]>([])

  // In a real application, you would fetch the events from your backend
  React.useEffect(() => {
    setEvents([
      {
        id: "1",
        title: "Surgery 1",
        start: new Date(2023, 5, 1, 9, 0),
        end: new Date(2023, 5, 1, 11, 0),
      },
      {
        id: "2",
        title: "Surgery 2",
        start: new Date(2023, 5, 2, 14, 0),
        end: new Date(2023, 5, 2, 16, 0),
      },
    ])
  }, [])

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={["week", "day"]}
        step={60}
        timeslots={1}
      />
    </div>
  )
}

