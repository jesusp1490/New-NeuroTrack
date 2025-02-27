import { useAuth } from "@/app/context/AuthContext"
import CirujanoDashboard from "./CirujanoDashboard"
import NeurofisiologoDashboard from "./NeurofisiologoDashboard"
import AdministrativoDashboard from "./AdministrativoDashboard"
import JefeDepartamentoDashboard from "./JefeDepartamentoDashboard"

export default function Dashboard() {
  const { userData } = useAuth()

  if (!userData) {
    return <div>Loading...</div>
  }

  switch (userData.role) {
    case "cirujano":
      return <CirujanoDashboard />
    case "neurofisiologo":
      return <NeurofisiologoDashboard />
    case "administrativo":
      return <AdministrativoDashboard />
    case "jefe_departamento":
      return <JefeDepartamentoDashboard />
    default:
      return <div>Invalid user role</div>
  }
}

