import { useAuth } from "@/app/context/AuthContext"
import OperatingRoomCalendar from "./OperatingRoomCalendar"
import SurgeryBookingDialog from "./SurgeryBookingDialog"

export default function CirujanoDashboard() {
  const { userData } = useAuth()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cirujano Dashboard</h1>
      <p>Welcome, Dr. {userData?.user?.displayName}</p>
      <p>Hospital: {userData?.hospital}</p>
      <OperatingRoomCalendar hospital={userData?.hospital} />
      <SurgeryBookingDialog />
    </div>
  )
}

