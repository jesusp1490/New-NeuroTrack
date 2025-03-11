"use client"

// Adapted from shadcn/ui toast component
import { useState } from "react"

export type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

type ToastState = ToastProps & {
  id: string
  open: boolean
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const toast = ({ title, description, variant = "default", duration = 5000 }: ToastProps) => {
    const id = `toast-${toastCount++}`
    const newToast = { id, title, description, variant, duration, open: true }

    setToasts((prevToasts) => [...prevToasts, newToast])

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.map((t) => (t.id === id ? { ...t, open: false } : t)))

        // Remove toast after animation (300ms)
        setTimeout(() => {
          setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id))
        }, 300)
      }, duration)
    }

    return id
  }

  const dismiss = (id: string) => {
    setToasts((prevToasts) => prevToasts.map((t) => (t.id === id ? { ...t, open: false } : t)))

    // Remove toast after animation (300ms)
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id))
    }, 300)
  }

  return { toast, dismiss, toasts }
}

