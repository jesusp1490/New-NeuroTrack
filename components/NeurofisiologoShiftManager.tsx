"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { addDoc, collection, query, where, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Shift } from "@/types"
import { format } from "date-fns"

export default function NeurofisiologoShiftManager() {
  const { userData } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [newShift, setNewShift] = useState<
    Omit<Shift, "id" | "neurophysiologistId" | "booked" | "createdAt" | "updatedAt">
  >({
    date: "",
    type: "morning",
    hospitalId: userData?.hospitalId || "",
    neurophysiologistName: userData?.name || "",
  })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [error, setError] = useState<string | null>(null)

  const fetchShifts = useCallback(async () => {
    if (!userData?.id) return

    const shiftsRef = collection(db, "shifts")
    const q = query(
      shiftsRef,
      where("neurophysiologistId", "==", userData.id),
      where("date", ">=", format(new Date(), "yyyy-MM-dd")),
    )
    const querySnapshot = await getDocs(q)
    const fetchedShifts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Shift)
    setShifts(fetchedShifts)
  }, [userData?.id])

  useEffect(() => {
    if (userData?.id) {
      fetchShifts()
    }
  }, [userData?.id, fetchShifts])

  const addShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData?.id || !selectedDate) return

    const currentTime = new Date().toISOString()

    const shift: Omit<Shift, "id"> = {
      ...newShift,
      date: format(selectedDate, "yyyy-MM-dd"),
      neurophysiologistId: userData.id,
      neurophysiologistName: userData.name || "",
      booked: false,
      createdAt: currentTime,
      updatedAt: currentTime, // Add this line to fix the TypeScript error
    }

    try {
      await addDoc(collection(db, "shifts"), shift)
      await fetchShifts()
      setNewShift({ ...newShift, type: "morning" })
      setSelectedDate(undefined)
    } catch (error) {
      console.error("Error adding shift:", error)
    }
  }

  const removeShift = async (id: string) => {
    try {
      const shiftRef = doc(db, "shifts", id)
      const shiftSnap = await getDoc(shiftRef)

      if (shiftSnap.exists() && shiftSnap.data().neurophysiologistId === userData?.id) {
        await deleteDoc(shiftRef)
        await fetchShifts()
      } else {
        console.error("Cannot delete shift: User does not have permission or shift does not exist")
        setError("You don't have permission to delete this shift or the shift no longer exists.")
      }
    } catch (error) {
      console.error("Error removing shift:", error)
      setError("Failed to remove shift. Please try again.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Shifts</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={addShift} className="space-y-4">
          <div>
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />
          </div>
          <div>
            <Select
              value={newShift.type}
              onValueChange={(value: "morning" | "afternoon") => setNewShift({ ...newShift, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shift type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Add Shift</Button>
        </form>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <div className="mt-6">
          <h3 className="text-lg font-medium">Your Shifts</h3>
          <ul className="mt-2 space-y-2">
            {shifts.map((shift) => (
              <li key={shift.id} className="flex justify-between items-center">
                <span>
                  {format(new Date(shift.date), "PPP")} - {shift.type}
                </span>
                <Button variant="destructive" onClick={() => removeShift(shift.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

