"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format, addMinutes, parse, isAfter } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { surgeryTypes, SurgeryType } from "@/lib/surgeryTypes"

interface Props {
  isOpen: boolean
  onClose: () => void
  onComplete: (event: any) => void
  selectedSlot?: { start: Date; end: Date; resourceId?: string } | null
  userData: { hospitalId?: string; id?: string; role?: string } | null
}

interface Neurophysiologist {
  id: string
  name: string
}

export function SurgeryBookingDialog({ isOpen, onClose, onComplete, selectedSlot, userData }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(selectedSlot?.start || new Date())
  const [formData, setFormData] = useState({
    surgeryTypeId: "",
    additionalNotes: "",
    startTime: selectedSlot ? format(selectedSlot.start, "HH:mm") : "08:00",
    endTime: selectedSlot ? format(addMinutes(selectedSlot.start, 60), "HH:mm") : "09:00",
    selectedNeurophysiologists: [] as string[],
  })
  const [selectedSurgeryType, setSelectedSurgeryType] = useState<SurgeryType | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [availableNeurophysiologists, setAvailableNeurophysiologists] = useState<Neurophysiologist[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (formData.surgeryTypeId) {
      const surgeryType = surgeryTypes.find((st) => st.id === formData.surgeryTypeId)
      setSelectedSurgeryType(surgeryType || null)
      if (surgeryType && selectedDate) {
        const startTime = parse(formData.startTime, "HH:mm", new Date())
        setFormData((prev) => ({
          ...prev,
          endTime: format(addMinutes(startTime, surgeryType.estimatedDuration), "HH:mm"),
        }))
      }
    }
  }, [formData.surgeryTypeId, formData.startTime, selectedDate])

  const fetchAvailableNeurophysiologists = useCallback(async () => {
    if (!userData?.hospitalId || !selectedDate) return

    try {
      const shiftsRef = collection(db, "shifts")
      const shiftDate = format(selectedDate, "yyyy-MM-dd")
      const startHour = Number.parseInt(formData.startTime.split(":")[0], 10)

      // Determine shift type based on the selected time
      const shiftType = startHour >= 14 ? "afternoon" : "morning"

      console.log("Fetching shifts with params:", {
        hospitalId: userData.hospitalId,
        date: shiftDate,
        type: shiftType,
        startHour,
      })

      // Query shifts for the specific date, hospital, and shift type
      const q = query(
        shiftsRef,
        where("hospitalId", "==", userData.hospitalId),
        where("date", "==", shiftDate),
        where("type", "==", shiftType),
      )

      const querySnapshot = await getDocs(q)
      console.log(
        "Found shifts:",
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      )

      const neurophysiologists: Neurophysiologist[] = []
      const processedIds = new Set()

      for (const docSnapshot of querySnapshot.docs) {
        const shiftData = docSnapshot.data()

        // Skip if the shift is already booked
        if (shiftData.booked) continue

        // Skip if we already processed this neurophysiologist
        if (processedIds.has(shiftData.neurophysiologistId)) continue

        const userRef = doc(db, "users", shiftData.neurophysiologistId)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          neurophysiologists.push({
            id: shiftData.neurophysiologistId,
            name: userData.name || shiftData.neurophysiologistName || "Unknown",
          })
          processedIds.add(shiftData.neurophysiologistId)
        }
      }

      console.log("Available neurophysiologists:", neurophysiologists)
      setAvailableNeurophysiologists(neurophysiologists)

      // Clear any previously selected neurophysiologists that are no longer available
      setFormData((prev) => ({
        ...prev,
        selectedNeurophysiologists: prev.selectedNeurophysiologists.filter((id) =>
          neurophysiologists.some((neuro) => neuro.id === id),
        ),
      }))
    } catch (error) {
      console.error("Error fetching neurophysiologists:", error)
      setError("Failed to fetch available neurophysiologists. Please try again.")
      setAvailableNeurophysiologists([])
    }
  }, [userData?.hospitalId, selectedDate, formData.startTime])

  useEffect(() => {
    if (isOpen) {
      console.log("Dialog opened or time/date changed - fetching neurophysiologists")
      fetchAvailableNeurophysiologists()
    }
  }, [isOpen, fetchAvailableNeurophysiologists]) // Removed unnecessary dependencies: selectedDate, formData.startTime

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !userData?.id || formData.selectedNeurophysiologists.length === 0 || !selectedSurgeryType) {
      setError("Missing required information. Please fill in all fields.")
      return
    }

    if (userData.role !== "cirujano" && userData.role !== "administrativo") {
      setError("Only surgeons and administrative staff can book surgeries.")
      return
    }

    const startDateTime = new Date(selectedDate)
    const [startHours, startMinutes] = formData.startTime.split(":").map(Number)
    startDateTime.setHours(startHours, startMinutes, 0, 0)

    const endDateTime = new Date(selectedDate)
    const [endHours, endMinutes] = formData.endTime.split(":").map(Number)
    endDateTime.setHours(endHours, endMinutes, 0, 0)

    if (isAfter(startDateTime, endDateTime)) {
      setError("End time must be after start time.")
      return
    }

    setIsChecking(true)
    setError(null)
    try {
      let newSurgeryRef: any

      await runTransaction(db, async (transaction) => {
        // Create the surgery document
        const surgeryData = {
          surgeryTypeId: formData.surgeryTypeId,
          surgeryTypeName: selectedSurgeryType.name,
          date: startDateTime.toISOString(),
          estimatedDuration: selectedSurgeryType.estimatedDuration,
          additionalNotes: formData.additionalNotes,
          createdAt: serverTimestamp(),
          status: "scheduled",
          neurophysiologistIds: formData.selectedNeurophysiologists,
          hospitalId: userData.hospitalId,
          surgeonId: userData.id,
          materials: selectedSurgeryType.materials || [],
        }

        const surgeriesRef = collection(db, "surgeries")
        newSurgeryRef = doc(surgeriesRef)
        transaction.set(newSurgeryRef, surgeryData)

        // Update all selected neurophysiologist shifts to mark them as booked
        const shiftsRef = collection(db, "shifts")
        const shiftDate = format(startDateTime, "yyyy-MM-dd")
        const shiftType = startHours < 14 ? "morning" : "afternoon"

        for (const neurophysiologistId of formData.selectedNeurophysiologists) {
          const shiftQuery = query(
            shiftsRef,
            where("date", "==", shiftDate),
            where("type", "==", shiftType),
            where("neurophysiologistId", "==", neurophysiologistId),
            where("hospitalId", "==", userData.hospitalId),
          )

          const shiftSnapshot = await getDocs(shiftQuery)
          if (!shiftSnapshot.empty) {
            const shiftDoc = shiftSnapshot.docs[0]
            transaction.update(doc(db, "shifts", shiftDoc.id), { booked: true })
          }
        }

        return newSurgeryRef.id
      })

      onComplete({
        id: newSurgeryRef.id,
        title: `Surgery: ${selectedSurgeryType.name}`,
        start: startDateTime,
        end: endDateTime,
        type: "surgery",
      })

      onClose()
    } catch (error) {
      console.error("Error booking surgery:", error)
      setError(`Error booking surgery: ${error instanceof Error ? error.message : "Unknown error occurred"}`)
    } finally {
      setIsChecking(false)
    }
  }

  const toggleNeurophysiologist = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedNeurophysiologists: prev.selectedNeurophysiologists.includes(id)
        ? prev.selectedNeurophysiologists.filter((n) => n !== id)
        : [...prev.selectedNeurophysiologists, id],
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Surgery</DialogTitle>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surgeryType">Surgery Type</Label>
            <Select
              value={formData.surgeryTypeId}
              onValueChange={(value: string) => setFormData({ ...formData, surgeryTypeId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select surgery type" />
              </SelectTrigger>
              <SelectContent>
                {surgeryTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newStartTime = e.target.value
                setFormData((prev) => ({ ...prev, startTime: newStartTime }))
                // Trigger a re-fetch when the start time changes
                fetchAvailableNeurophysiologists()
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Select Neurophysiologists</Label>
            {availableNeurophysiologists.length === 0 ? (
              <p className="text-sm text-red-500">No neurophysiologists available for this time slot</p>
            ) : (
              <div className="space-y-2">
                {availableNeurophysiologists.map((neuro) => (
                  <div key={neuro.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={neuro.id}
                      checked={formData.selectedNeurophysiologists.includes(neuro.id)}
                      onCheckedChange={() => toggleNeurophysiologist(neuro.id)}
                    />
                    <Label htmlFor={neuro.id}>{neuro.name}</Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Input
              id="notes"
              value={formData.additionalNotes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, additionalNotes: e.target.value })
              }
            />
          </div>

          {selectedSurgeryType && (
            <div className="space-y-2">
              <Label>Required Materials</Label>
              <ul className="list-disc pl-5">
                {selectedSurgeryType.materials.map((material) => (
                  <li key={material.id}>
                    {material.name} - Quantity: {material.quantity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isChecking ||
                availableNeurophysiologists.length === 0 ||
                !formData.surgeryTypeId ||
                formData.selectedNeurophysiologists.length === 0
              }
            >
              {isChecking ? "Checking availability..." : "Book Surgery"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

