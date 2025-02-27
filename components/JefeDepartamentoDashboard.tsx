import { useAuth } from "@/app/context/AuthContext"
import OperatingRoomCalendar from "./OperatingRoomCalendar"
import HospitalSelector from "./HospitalSelector"
import NeurofisiologoShiftManager from "./NeurofisiologoShiftManager"

export default function JefeDepartamentoDashboard() {
  const { userData } = useAuth()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Jefe de Departamento Dashboard</h1>
      <p>Welcome, Dr. {userData?.user?.displayName}</p>
      <HospitalSelector />
      <OperatingRoomCalendar />
      <NeurofisiologoShiftManager />
    </div>
  )
}

