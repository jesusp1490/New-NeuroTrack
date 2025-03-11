"use client"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "../../app/hooks/use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-md w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "p-4 rounded-md shadow-md transition-all duration-300 transform translate-x-0 opacity-100",
            toast.open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
            toast.variant === "destructive" ? "bg-red-600 text-white" : "bg-white dark:bg-gray-800 border",
          )}
        >
          <div className="flex justify-between items-start">
            <div>
              {toast.title && <h3 className="font-medium">{toast.title}</h3>}
              {toast.description && <p className="text-sm opacity-90 mt-1">{toast.description}</p>}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

