// Actualizar el tipo User para incluir múltiples hospitales
export interface User {
  id: string
  email: string
  name: string
  role: "cirujano" | "neurofisiologo" | "administrativo" | "jefe_departamento"
  hospitalId: string // Hospital principal (para cirujanos)
  hospitals: string[] // Lista de IDs de hospitales donde trabaja (para neurofisiólogos)
  gender: string
  profilePictureUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Hospital {
  id: string
  name: string
  logoUrl?: string // Add this field for hospital logos
}

export interface Room {
  id: string
  name: string
  hospitalId: string
}

export interface Shift {
  id: string
  neurophysiologistId: string
  hospitalId: string
  roomId?: string // Add this property
  date: string
  type: "morning" | "afternoon"
  booked: boolean
  createdAt: string
  updatedAt: string
}

export interface Surgery {
  id: string
  surgeonId: string
  neurophysiologistIds: string[] // Changed from single ID to array of IDs
  hospitalId: string
  roomId?: string
  patientName: string
  surgeryType: string
  date: string
  estimatedDuration: number
  status: "scheduled" | "completed" | "cancelled"
  materials?: Array<{
    id: string
    name: string
    quantity: number
    ref?: string
  }>
  notes?: string
  createdAt: string
  updatedAt: string
  shiftId?: string // Add this field
}

export interface SurgeryType {
  id: string
  name: string
  estimatedDuration: number
}

export interface SurgeryMaterial {
  id: string
  name: string
  ref?: string
}

// Add the missing Booking type
export interface Booking {
  id: string
  roomId: string
  date: string // ISO string format
  startTime: string
  endTime: string
  surgeonId: string
  neurophysiologistId: string
  status: "scheduled" | "completed" | "cancelled"
  createdAt: string
  updatedAt: string
}



