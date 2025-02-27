export type UserRole = "cirujano" | "neurofisiologo" | "administrativo" | "jefe_departamento"

export interface Hospital {
  id: string
  name: string
  picture: string
}

export interface Room {
  id: string
  name: string
  // Add other properties as needed
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  hospitalId: string
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: string
  additionalNotes: string
  createdAt: string
  date: string
  estimatedDuration: number
  neurophysiologistIds: string[]
  roomId: string
  surgeonId: string
  surgeryType: string
  status: "scheduled" | "completed" | "cancelled"
}

export interface Surgery {
  id: string
  additionalNotes: string
  bookingId: string
  createdAt: string
  date: string
  estimatedDuration: number
  neurophysiologistIds: string[]
  roomId: string
  status: "scheduled" | "completed" | "cancelled"
  surgeonId: string
  surgeryType: string
}

export interface Shift {
  id: string
  booked: boolean
  createdAt: string
  date: string
  hospitalId: string
  neurophysiologistId: string
  type: "morning" | "afternoon"
}

