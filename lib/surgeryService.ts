import { collection, addDoc, doc, updateDoc, getDoc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Surgery } from "@/types"
import { surgeryTypes } from "@/lib/surgeryTypes"

// This function will handle both creating the surgery and updating the shift
export async function bookSurgery(surgeryData: Partial<Surgery>, shiftId: string | null) {
  try {
    // Remove any undefined fields from surgeryData
    const cleanedData = Object.fromEntries(Object.entries(surgeryData).filter(([_, value]) => value !== undefined))

    // Get surgery type details if available
    if (cleanedData.surgeryType) {
      const surgeryType = surgeryTypes.find((type) => type.id === cleanedData.surgeryType)
      if (surgeryType) {
        // Add materials to the surgery data
        cleanedData.materials = surgeryType.materials

        // If no estimated duration was provided, use the one from the surgery type
        if (!cleanedData.estimatedDuration) {
          cleanedData.estimatedDuration = surgeryType.estimatedDuration
        }
      }
    }

    // Step 1: Create the surgery document
    const surgeriesRef = collection(db, "surgeries")
    const surgeryRef = await addDoc(surgeriesRef, {
      ...cleanedData,
      createdAt: new Date().toISOString(),
    })

    // Step 2: If we have a shiftId, fetch the shift to check if it's available
    if (shiftId) {
      const shiftRef = doc(db, "shifts", shiftId)
      const shiftSnap = await getDoc(shiftRef)

      if (shiftSnap.exists() && !shiftSnap.data().booked) {
        // Update the shift to mark it as booked
        await updateDoc(shiftRef, { booked: true })
      }
    }

    return { success: true, surgeryId: surgeryRef.id }
  } catch (error) {
    console.error("Error booking surgery:", error)
    throw error
  }
}

// Function to fetch surgery types
export async function fetchSurgeryTypes() {
  try {
    // Use the predefined surgery types from types/surgery.ts
    if (surgeryTypes && surgeryTypes.length > 0) {
      return surgeryTypes
    }

    // Fallback to fetching from Firestore if needed
    try {
      const surgeryTypesRef = collection(db, "surgeryTypes")
      const querySnapshot = await getDocs(surgeryTypesRef)

      if (querySnapshot.empty) {
        return surgeryTypes || []
      }

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.warn("Could not fetch surgery types from Firestore, using defaults", error)
      return surgeryTypes || []
    }
  } catch (error) {
    console.error("Error in fetchSurgeryTypes:", error)
    throw error
  }
}

