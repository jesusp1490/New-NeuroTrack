// User type with multiple hospitals support
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
  logoUrl?: string
  address?: string
  city?: string
  phone?: string
  email?: string
  createdAt?: string
  updatedAt?: string
}

export interface Room {
  id: string
  name: string
  hospitalId: string
  type?: string
  capacity?: number
  available?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Shift {
  id: string
  neurophysiologistId: string
  neurophysiologistName?: string
  hospitalId: string
  roomId?: string
  date: string
  type: "morning" | "afternoon"
  booked: boolean
  surgeryId?: string // Reference to the surgery if booked
  createdAt: string
  updatedAt: string
}

export interface Surgery {
  id: string
  surgeonId: string
  surgeonName?: string // Added for convenience in UI
  neurophysiologistIds: string[] // Array of IDs for multiple neurophysiologists
  neurophysiologistNames?: string[] // Added for convenience in UI
  hospitalId: string
  hospitalName?: string // Added for convenience in UI
  roomId?: string
  roomName?: string // Added for convenience in UI
  patientName: string
  patientId?: string
  surgeryType: string
  type?: string // For backward compatibility
  date: string
  estimatedDuration: number
  status: "scheduled" | "completed" | "cancelled"
  materials?: Array<SurgeryMaterial>
  notes?: string
  createdAt: string
  updatedAt: string
  shiftId?: string // Reference to the shift
  bookingId?: string // Reference to the booking if using that system
  additionalRecipients?: string[] // For sending notifications to additional emails
  bookedBy?: {
    id: string
    name: string
    role: string
    email: string
  }
}

export interface SurgeryMaterial {
  id: string
  name: string
  quantity: number
  ref?: string // Código de referencia (opcional)
}

export interface SurgeryType {
  id: string
  name: string
  estimatedDuration: number
  materials: SurgeryMaterial[]
  description?: string
  createdAt?: string
  updatedAt?: string
}

// Booking type for the booking system
export interface Booking {
  id: string
  roomId: string
  date: string // ISO string format
  startTime: string
  endTime: string
  surgeonId: string
  neurophysiologistId: string // For backward compatibility
  neurophysiologistIds?: string[] // New field for multiple neurophysiologists
  surgeryId?: string // Reference to the surgery
  status: "scheduled" | "completed" | "cancelled"
  createdAt: string
  updatedAt: string
}

// Email notification settings
export interface EmailSettings {
  id: string
  userId: string
  additionalRecipients: string[]
  notifyOnNewSurgery: boolean
  notifyOnSurgeryUpdate: boolean
  notifyOnSurgeryCancel: boolean
  createdAt: string
  updatedAt: string
}

// PDF template settings
export interface PDFTemplate {
  id: string
  hospitalId: string
  name: string
  content: string
  createdAt: string
  updatedAt: string
}

