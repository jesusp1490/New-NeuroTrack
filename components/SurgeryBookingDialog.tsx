"use client"

import React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Props {
  isOpen: boolean
  onClose: () => void
  onComplete: (event: any) => void
  selectedSlot: { start: Date; end: Date } | null
  userData: { hospitalId?: string } | null
}

const surgeryTypes = [
  { id: "tipo1", name: "Tipo 1 - Cirugía General" },
  { id: "tipo2", name: "Tipo 2 - Neurocirugía" },
  { id: "tipo3", name: "Tipo 3 - Cirugía Especializada" },
]

export function SurgeryBookingDialog({ isOpen, onClose, onComplete, selectedSlot, userData }: Props) {
  const [formData, setFormData] = useState({
    surgeryType: "",
    estimatedDuration: 60,
    additionalNotes: "",
  })
  const [isChecking, setIsChecking] = useState(false)

  const checkNeurophysiologistAvailability = async (date: Date) => {
    const shiftsRef = collection(db, "shifts")
    const shiftType = date.getHours() < 12 ? "morning" : "afternoon"

    const q = query(
      shiftsRef,
      where("date", "==", date.toISOString().split("T")[0]),
      where("type", "==", shiftType),
      where("booked", "==", false),
      where("hospitalId", "==", userData?.hospitalId),
    )

    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return

    setIsChecking(true)
    try {
      const hasAvailableNeurophysiologist = await checkNeurophysiologistAvailability(selectedSlot.start)

      if (!hasAvailableNeurophysiologist) {
        alert("No neurophysiologists available for the selected time slot. Please choose another time.")
        setIsChecking(false)
        return
      }

      const booking = {
        surgeryType: formData.surgeryType,
        date: selectedSlot.start.toISOString(),
        estimatedDuration: formData.estimatedDuration,
        additionalNotes: formData.additionalNotes,
        createdAt: new Date().toISOString(),
        status: "scheduled",
        neurophysiologistIds: [], // Will be assigned later
        hospitalId: userData?.hospitalId,
      }

      const docRef = await addDoc(collection(db, "bookings"), booking)

      onComplete({
        id: docRef.id,
        title: `Surgery: ${formData.surgeryType}`,
        start: selectedSlot.start,
        end: new Date(selectedSlot.start.getTime() + formData.estimatedDuration * 60000),
        type: "surgery",
      })
    } catch (error) {
      console.error("Error booking surgery:", error)
      alert("Error booking surgery. Please try again.")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Surgery</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="surgeryType">Surgery Type</Label>
            <Select
              value={formData.surgeryType}
              onValueChange={(value: string) => setFormData({ ...formData, surgeryType: value })}
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
            <Label htmlFor="duration">Estimated Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.estimatedDuration}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, estimatedDuration: Number.parseInt(e.target.value) })
              }
              min={30}
              step={30}
            />
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isChecking}>
              {isChecking ? "Checking availability..." : "Book Surgery"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

