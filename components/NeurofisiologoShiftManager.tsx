"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { addDoc, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Shift } from "@/types"

export default function NeurofisiologoShiftManager() {
  const { userData } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [newShift, setNewShift] = useState<Omit<Shift, "id" | "neurophysiologistId" | "booked" | "createdAt">>({
    date: "",
    type: "morning",
    hospitalId: userData?.hospitalId || "",
  })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const fetchShifts = async () => {
    if (!userData?.id) return

    const shiftsRef = collection(db, "shifts")
    const q = query(
      shiftsRef,
      where("neurophysiologistId", "==", userData.id),
      where("date", ">=", new Date().toISOString().split("T")[0]),
    )
    const querySnapshot = await getDocs(q)
    const fetchedShifts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Shift)
    setShifts(fetchedShifts)
  }

  const memoizedFetchShifts = useCallback(fetchShifts, [])

  useEffect(() => {
    if (userData?.id) {
      memoizedFetchShifts()
    }
  }, [userData?.id, memoizedFetchShifts])

  const addShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData?.id || !selectedDate) return

    const shift: Omit<Shift, "id"> = {
      ...newShift,
      date: selectedDate.toISOString().split("T")[0],
      neurophysiologistId: userData.id,
      booked: false,
      createdAt: new Date().toISOString(),
    }

    try {
      await addDoc(collection(db, "shifts"), shift)
      await memoizedFetchShifts()
      setNewShift({ ...newShift, type: "morning" })
      setSelectedDate(undefined)
    } catch (error) {
      console.error("Error adding shift:", error)
    }
  }

  const removeShift = async (id: string) => {
    try {
      await deleteDoc(doc(db, "shifts", id))
      await memoizedFetchShifts()
    } catch (error) {
      console.error("Error removing shift:", error)
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
        <div className="mt-6">
          <h3 className="text-lg font-medium">Your Shifts</h3>
          <ul className="mt-2 space-y-2">
            {shifts.map((shift) => (
              <li key={shift.id} className="flex justify-between items-center">
                <span>
                  {new Date(shift.date).toLocaleDateString()} - {shift.type}
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

