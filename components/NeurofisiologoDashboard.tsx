import { useAuth } from "@/app/context/AuthContext"
import NeurofisiologoShiftManager from "./NeurofisiologoShiftManager"
import AssignedSurgeries from "./AssignedSurgeries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NeurofisiologoDashboard() {
  const { userData } = useAuth()

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Neurofisiólogo Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Welcome, {userData?.name}</p>
          <p className="text-sm text-muted-foreground">Hospital ID: {userData?.hospitalId}</p>
        </CardContent>
      </Card>
      <NeurofisiologoShiftManager />
      <AssignedSurgeries />
    </div>
  )
}

