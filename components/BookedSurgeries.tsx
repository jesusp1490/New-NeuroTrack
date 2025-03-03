"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, parseISO } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface SurgeryMaterial {
  id: string
  name: string
  quantity: number
}

interface Surgery {
  id: string
  surgeryTypeName: string
  date: string
  estimatedDuration: number
  additionalNotes: string
  status: string
  surgeonId: string
  neurophysiologistIds: string[]
  materials?: SurgeryMaterial[]
}

interface BookedSurgeriesProps {
  neurophysiologistId: string
}

export function BookedSurgeries({ neurophysiologistId }: BookedSurgeriesProps) {
  const [surgeries, setSurgeries] = useState<Surgery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSurgeries = async () => {
      try {
        console.log("Fetching surgeries for neurophysiologistId:", neurophysiologistId)
        const surgeriesRef = collection(db, "surgeries")
        const q = query(
          surgeriesRef,
          where("neurophysiologistIds", "array-contains", neurophysiologistId),
          where("status", "==", "scheduled"),
          orderBy("date", "asc"),
        )
        const querySnapshot = await getDocs(q)
        console.log("Query snapshot size:", querySnapshot.size)
        const fetchedSurgeries = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          console.log("Surgery document data:", data)
          return { id: doc.id, ...data } as Surgery
        })
        setSurgeries(fetchedSurgeries)
        console.log("Fetched surgeries:", fetchedSurgeries)
      } catch (err) {
        console.error("Error fetching surgeries:", err)
        setError(`Failed to fetch surgeries: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchSurgeries()
  }, [neurophysiologistId])

  if (loading) {
    return <div>Loading surgeries...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booked Surgeries</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {surgeries.length === 0 ? (
          <p>No surgeries booked at the moment.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Materials</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surgeries.map((surgery) => (
                <TableRow key={surgery.id}>
                  <TableCell>
                    {(() => {
                      try {
                        const date = parseISO(surgery.date)
                        return format(date, "PPP p")
                      } catch (error) {
                        console.error("Invalid date:", surgery.date)
                        return "Invalid Date"
                      }
                    })()}
                  </TableCell>
                  <TableCell>{surgery.surgeryTypeName}</TableCell>
                  <TableCell>{surgery.estimatedDuration} minutes</TableCell>
                  <TableCell>{surgery.status}</TableCell>
                  <TableCell>{surgery.additionalNotes}</TableCell>
                  <TableCell>
                    {surgery.materials ? (
                      <ul className="list-disc pl-5">
                        {surgery.materials.map((material) => (
                          <li key={material.id}>
                            {material.name} - Quantity: {material.quantity}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span>No materials specified</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

