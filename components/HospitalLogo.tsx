"use client"

import { useState } from "react"
import Image from "next/image"
import { Building2 } from "lucide-react"

interface HospitalLogoProps {
  logoUrl?: string
  hospitalName: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
  className?: string
}

export default function HospitalLogo({ logoUrl, hospitalName, size = "md", className = "" }: HospitalLogoProps) {
  const [imageError, setImageError] = useState(false)

  // Define sizes - making them significantly bigger
  const sizeClasses = {
    sm: "w-12 h-12", // Was w-10 h-10
    md: "w-16 h-16", // Was w-14 h-14
    lg: "w-24 h-24", // Was w-20 h-20
    xl: "w-32 h-32", // Was w-28 h-28
    "2xl": "w-40 h-40", // New extra large size
    "3xl": "w-56 h-56", // New super large size
  }

  const sizeClass = sizeClasses[size]

  // Add debug logging to check if logoUrl is being received
  console.log(`HospitalLogo for ${hospitalName}:`, { logoUrl, size, imageError })

  // If there's no logo or if there was an error loading the image, show a fallback
  if (!logoUrl || imageError) {
    return (
      <div className={`${sizeClass} flex items-center justify-center bg-gray-100 rounded-md ${className}`}>
        <Building2 className="text-gray-400" style={{ width: "60%", height: "60%" }} />
      </div>
    )
  }

  // Otherwise, show the logo
  return (
    <div className={`${sizeClass} relative rounded-md overflow-hidden ${className}`}>
      <Image
        src={logoUrl || "/placeholder.svg"}
        alt={`${hospitalName} logo`}
        fill
        className="object-contain"
        onError={() => {
          console.error(`Error loading image for ${hospitalName}:`, logoUrl)
          setImageError(true)
        }}
        unoptimized // Add this to bypass image optimization for external URLs
      />
    </div>
  )
}

