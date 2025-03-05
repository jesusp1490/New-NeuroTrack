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
  neurophysiologistId: string
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

