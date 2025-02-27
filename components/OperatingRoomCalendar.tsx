import { useState } from "react"
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
  resourceId: string
}

type Resource = {
  id: string
  title: string
}

export default function OperatingRoomCalendar({ hospital }: { hospital?: string }) {
  const [events, setEvents] = useState<Event[]>([])
  const [resources, setResources] = useState<Resource[]>([
    { id: "room1", title: "Operating Room 1" },
    { id: "room2", title: "Operating Room 2" },
    { id: "room3", title: "Operating Room 3" },
  ])

  return (
    <div className="h-[600px]">
      <h2 className="text-xl font-bold mb-4">Operating Room Calendar {hospital ? `- ${hospital}` : ""}</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        resources={resources}
        resourceIdAccessor="id"
        resourceTitleAccessor="title"
        views={["day", "week", "month"]}
        defaultView="week"
        step={60}
        timeslots={1}
      />
    </div>
  )
}

