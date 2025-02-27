import { useAuth } from "@/app/context/AuthContext"
import WeekCalendar from "./WeekCalendar"
import NeurofisiologoShiftManager from "./NeurofisiologoShiftManager"
import AssignedSurgeries from "./AssignedSurgeries"

export default function NeurofisiologoDashboard() {
  const { userData } = useAuth()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Neurofisiólogo Dashboard</h1>
      <p>Welcome, {userData?.user?.displayName}</p>
      <WeekCalendar />
      <NeurofisiologoShiftManager />
      <AssignedSurgeries />
    </div>
  )
}

