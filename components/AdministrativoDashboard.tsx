import { useAuth } from "@/app/context/AuthContext"
import OperatingRoomCalendar from "./OperatingRoomCalendar"
import HospitalSelector from "./HospitalSelector"
import NotificationHandler from "./NotificationHandler"

export default function AdministrativoDashboard() {
  const { userData } = useAuth()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Administrativo Dashboard</h1>
      <p>Welcome, {userData?.user?.displayName}</p>
      <HospitalSelector />
      <OperatingRoomCalendar />
      <NotificationHandler />
    </div>
  )
}

