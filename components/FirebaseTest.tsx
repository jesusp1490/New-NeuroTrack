"use client"

import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"

export default function FirebaseTest() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setIsInitialized(true)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div>
      <h2>Firebase Initialization Test</h2>
      <p>{isInitialized ? "Firebase initialized successfully!" : "Initializing Firebase..."}</p>
    </div>
  )
}

