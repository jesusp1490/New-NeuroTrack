"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Surgery, SurgeryType, User } from "@/types"
import { bookSurgery, fetchSurgeryTypes } from "@/lib/surgeryService"
import { surgeryTypes } from "@/lib/surgeryTypes"
import { sendSurgeryNotificationEmails } from "@/lib/emailService"

export interface SlotInfo {
  start: Date
  end: Date
  resourceId?: string
  slots?: Date[]
  action?: string
  shiftIds?: string[] // Added to support multiple shifts
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  selectedSlot?: SlotInfo
  userData: User
  hospitalId: string
  hospitalName: string
  surgeryTypes?: SurgeryType[]
}

export default function SurgeryBookingDialog({
  isOpen,
  onClose,
  onComplete,
  selectedSlot,
  userData,
  hospitalId,
  hospitalName,
  surgeryTypes: propSurgeryTypes,
}: Props) {
  const [date, setDate] = useState<Date | undefined>(selectedSlot?.start)
  const [time, setTime] = useState(selectedSlot ? format(selectedSlot.start, "HH:mm") : "09:00")
  const [endTime, setEndTime] = useState(
    selectedSlot ? format(selectedSlot.end || new Date(selectedSlot.start.getTime() + 60 * 60000), "HH:mm") : "10:00",
  )
  const [availableNeurophysiologists, setAvailableNeurophysiologists] = useState<User[]>([])
  const [selectedNeurophysiologists, setSelectedNeurophysiologists] = useState<string[]>([])
  const [surgeryType, setSurgeryType] = useState("")
  const [patientName, setPatientName] = useState("")
  const [estimatedDuration, setEstimatedDuration] = useState("60")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [availableSurgeryTypes, setAvailableSurgeryTypes] = useState<SurgeryType[]>(
    propSurgeryTypes || surgeryTypes || [],
  )
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([])

  // Update estimated duration when surgery type changes
  useEffect(() => {
    if (surgeryType) {
      const selectedType = availableSurgeryTypes.find((type) => type.id === surgeryType)
      if (selectedType && selectedType.estimatedDuration) {
        setEstimatedDuration(selectedType.estimatedDuration.toString())
      }
    }
  }, [surgeryType, availableSurgeryTypes])

  // Fetch surgery types if not provided
  useEffect(() => {
    const getSurgeryTypes = async () => {
      if (propSurgeryTypes && propSurgeryTypes.length > 0) {
        setAvailableSurgeryTypes(propSurgeryTypes)
        return
      }

      if (surgeryTypes && surgeryTypes.length > 0) {
        setAvailableSurgeryTypes(surgeryTypes)
        return
      }

      try {
        const types = await fetchSurgeryTypes()
        setAvailableSurgeryTypes(types as SurgeryType[])
      } catch (error) {
        console.error("Error fetching surgery types:", error)
      }
    }

    getSurgeryTypes()
  }, [propSurgeryTypes])

  const checkAvailableNeurophysiologists = useCallback(
    async (selectedDate: Date, selectedTime: string) => {
      setIsLoading(true)
      setError("")
      try {
        // Convert selected time to hours and minutes
        const [hours, minutes] = selectedTime.split(":").map(Number)
        const selectedDateTime = new Date(selectedDate)
        selectedDateTime.setHours(hours, minutes, 0, 0)

        // Determine if this is a morning or afternoon slot
        const isMorningSlot = hours >= 8 && hours < 14
        const shiftType = isMorningSlot ? "morning" : "afternoon"

        // Query shifts for the selected date and hospital
        const shiftsRef = collection(db, "shifts")
        const shiftsQuery = query(
          shiftsRef,
          where("hospitalId", "==", hospitalId),
          where("date", "==", format(selectedDate, "yyyy-MM-dd")),
          where("type", "==", shiftType),
          where("booked", "==", false),
        )

        const shiftsSnapshot = await getDocs(shiftsQuery)

        if (shiftsSnapshot.empty) {
          setAvailableNeurophysiologists([])
          setSelectedShiftIds([])
          setError("No hay neurofisiólogos disponibles para esta fecha y hora")
          return
        }

        // Get unique neurophysiologist IDs from available shifts
        const neurophysiologistIds = new Set<string>()
        const shiftMap = new Map<string, string>() // Map neurophysiologistId to shiftId

        shiftsSnapshot.forEach((doc) => {
          const shift = doc.data()
          neurophysiologistIds.add(shift.neurophysiologistId)
          shiftMap.set(shift.neurophysiologistId, doc.id)
        })

        // Convert Set to Array before iterating
        const neurophysiologistIdsArray = Array.from(neurophysiologistIds)

        // Fetch neurophysiologist details
        const neurophysiologists: User[] = []
        for (const id of neurophysiologistIdsArray) {
          const usersRef = collection(db, "users")
          const usersQuery = query(usersRef, where("role", "==", "neurofisiologo"))
          const usersSnapshot = await getDocs(usersQuery)

          usersSnapshot.forEach((doc) => {
            if (doc.id === id) {
              neurophysiologists.push({ id: doc.id, ...doc.data() } as User)
            }
          })
        }

        if (neurophysiologists.length === 0) {
          setError("No hay neurofisiólogos disponibles para esta fecha y hora")
          setSelectedShiftIds([])
        } else {
          setError("")
          // Clear previous selections when date/time changes
          setSelectedNeurophysiologists([])
          setSelectedShiftIds([])
        }

        setAvailableNeurophysiologists(neurophysiologists)
      } catch (error) {
        console.error("Error checking availability:", error)
        setError("Error al verificar disponibilidad")
        setSelectedShiftIds([])
      } finally {
        setIsLoading(false)
      }
    },
    [hospitalId],
  )

  useEffect(() => {
    if (date) {
      checkAvailableNeurophysiologists(date, time)
    }
  }, [date, time, checkAvailableNeurophysiologists])

  // Update selected shift IDs when neurophysiologists selection changes
  useEffect(() => {
    if (availableNeurophysiologists.length > 0) {
      // We need to find the shift IDs for selected neurophysiologists
      const updateShiftIds = async () => {
        try {
          if (!date) return

          // Determine if this is a morning or afternoon slot
          const [hours] = time.split(":").map(Number)
          const isMorningSlot = hours >= 8 && hours < 14
          const shiftType = isMorningSlot ? "morning" : "afternoon"

          const newShiftIds: string[] = []

          for (const neuroId of selectedNeurophysiologists) {
            // Query shifts for the selected date, hospital, and neurophysiologist
            const shiftsRef = collection(db, "shifts")
            const shiftsQuery = query(
              shiftsRef,
              where("hospitalId", "==", hospitalId),
              where("date", "==", format(date, "yyyy-MM-dd")),
              where("type", "==", shiftType),
              where("neurophysiologistId", "==", neuroId),
              where("booked", "==", false),
            )

            const shiftsSnapshot = await getDocs(shiftsQuery)

            if (!shiftsSnapshot.empty) {
              newShiftIds.push(shiftsSnapshot.docs[0].id)
            }
          }

          setSelectedShiftIds(newShiftIds)
        } catch (error) {
          console.error("Error updating shift IDs:", error)
          setSelectedShiftIds([])
        }
      }

      updateShiftIds()
    }
  }, [selectedNeurophysiologists, date, time, hospitalId, availableNeurophysiologists])

  const handleNeurophysiologistChange = (neuroId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedNeurophysiologists((prev) => [...prev, neuroId])
    } else {
      setSelectedNeurophysiologists((prev) => prev.filter((id) => id !== neuroId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || selectedNeurophysiologists.length === 0 || !surgeryType || !patientName || !endTime) {
      setError("Por favor complete todos los campos requeridos")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Extract start and end times for the surgery data
      const [startHours, startMinutes] = time.split(":").map(Number)
      const [endHours, endMinutes] = endTime.split(":").map(Number)
      const surgeryDateTime = new Date(date)
      surgeryDateTime.setHours(startHours, startMinutes, 0, 0)

      // Calculate duration in minutes
      const startTimeMinutes = startHours * 60 + startMinutes
      const endTimeMinutes = endHours * 60 + endMinutes
      const durationMinutes = endTimeMinutes - startTimeMinutes

      // Update estimated duration based on selected end time
      setEstimatedDuration(durationMinutes.toString())

      // Create the surgery document with the shift ID reference
      const surgeryData: Partial<Surgery> = {
        date: surgeryDateTime.toISOString(),
        neurophysiologistIds: selectedNeurophysiologists, // Now using array of IDs
        surgeryType,
        patientName,
        estimatedDuration: Number.parseInt(estimatedDuration),
        notes,
        hospitalId,
        status: "scheduled",
        surgeonId: userData.id,
        // Only include roomId if it's defined
        ...(selectedSlot?.resourceId ? { roomId: selectedSlot.resourceId } : {}),
        createdAt: new Date().toISOString(),
      }

      console.log("Surgery data being submitted:", surgeryData)

      // Book the surgery and update the shifts
      const result = await bookSurgery(surgeryData, selectedShiftIds)

      // Send notification emails
      if (result.success && result.surgeryId) {
        try {
          await sendSurgeryNotificationEmails(result.surgeryId)
        } catch (emailError) {
          console.error("Error sending notification emails:", emailError)
          // Continue even if email sending fails
        }
      }

      // Call onComplete to refresh the calendar
      onComplete()
    } catch (error) {
      console.error("Error submitting surgery:", error)
      setError("Error al programar la cirugía")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Programar Cirugía - {hospitalName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              disabled={(date) => date < new Date()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Hora</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar hora" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => i + 8)
                  .filter((hour) => hour >= 8 && hour < 20)
                  .map((hour) => (
                    <SelectItem key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                      {`${hour.toString().padStart(2, "0")}:00`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">Hora de finalización</Label>
            <Select
              value={endTime}
              onValueChange={setEndTime}
              disabled={!time} // Disable until start time is selected
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar hora de finalización" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => i + 8)
                  .filter((hour) => {
                    const [startHour] = time.split(":").map(Number)
                    return hour > startHour && hour <= (startHour < 14 ? 14 : 20)
                  })
                  .map((hour) => (
                    <SelectItem key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                      {`${hour.toString().padStart(2, "0")}:00`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Neurofisiólogos Disponibles</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              {availableNeurophysiologists.length === 0 ? (
                <p className="text-sm text-gray-500">No hay neurofisiólogos disponibles para esta fecha y hora</p>
              ) : (
                <div className="space-y-2">
                  {availableNeurophysiologists.map((neuro) => (
                    <div key={neuro.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`neuro-${neuro.id}`}
                        checked={selectedNeurophysiologists.includes(neuro.id)}
                        onCheckedChange={(checked) => handleNeurophysiologistChange(neuro.id, checked === true)}
                      />
                      <Label htmlFor={`neuro-${neuro.id}`} className="text-sm cursor-pointer">
                        {neuro.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="surgeryType">Tipo de Cirugía</Label>
            <Select value={surgeryType} onValueChange={setSurgeryType}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de cirugía" />
              </SelectTrigger>
              <SelectContent>
                {availableSurgeryTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patientName">Nombre del Paciente</Label>
            <Input
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Nombre del paciente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedDuration">Duración Estimada (minutos)</Label>
            <Input
              id="estimatedDuration"
              type="number"
              min="30"
              max="480"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || availableNeurophysiologists.length === 0 || selectedNeurophysiologists.length === 0
              }
            >
              {isLoading ? "Verificando..." : "Programar Cirugía"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

