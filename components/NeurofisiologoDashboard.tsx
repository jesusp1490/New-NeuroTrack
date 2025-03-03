import { useAuth } from "@/app/context/AuthContext"
import NeurofisiologoShiftManager from "./NeurofisiologoShiftManager"
import { BookedSurgeries } from "./BookedSurgeries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NeurofisiologoDashboard() {
  const { userData } = useAuth()

  if (!userData || !userData.id) {
    return <div>Loading user data...</div>
  }

  console.log("NeurofisiologoDashboard - userData:", userData)

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Neurofisiólogo Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Welcome, {userData.name}</p>
          <p className="text-sm text-muted-foreground">Hospital ID: {userData.hospitalId}</p>
          <p className="text-sm text-muted-foreground">User ID: {userData.id}</p>
        </CardContent>
      </Card>
      <NeurofisiologoShiftManager />
      <BookedSurgeries neurophysiologistId={userData.id} />
    </div>
  )
}

