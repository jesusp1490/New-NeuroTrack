import { collection, addDoc, doc, updateDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Surgery, SurgeryType } from "@/types"

/**
 * Books a surgery and updates the shifts
 * @param surgeryData The surgery data to save
 * @param shiftIds The IDs of the shifts to update
 * @returns The result of the booking operation
 */
export async function bookSurgery(surgeryData: Partial<Surgery>, shiftIds: string[]) {
  try {
    // Create the surgery document
    const surgeryRef = await addDoc(collection(db, "surgeries"), {
      ...surgeryData,
      updatedAt: new Date().toISOString(),
    })

    // Update the shifts to mark them as booked
    for (const shiftId of shiftIds) {
      await updateDoc(doc(db, "shifts", shiftId), {
        booked: true,
        surgeryId: surgeryRef.id,
        updatedAt: new Date().toISOString(),
      })
    }

    return { success: true, surgeryId: surgeryRef.id }
  } catch (error) {
    console.error("Error booking surgery:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Fetches surgery types from Firestore
 * @returns An array of surgery types
 */
export async function fetchSurgeryTypes(): Promise<SurgeryType[]> {
  try {
    const typesRef = collection(db, "surgeryTypes")
    const snapshot = await getDocs(typesRef)

    if (snapshot.empty) {
      console.log("No surgery types found, using default types")
      return []
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SurgeryType[]
  } catch (error) {
    console.error("Error fetching surgery types:", error)
    return []
  }
}

/**
 * Checks if a surgeon is available at the specified time
 * @param surgeonId The ID of the surgeon
 * @param date The date of the surgery
 * @param startTime The start time of the surgery
 * @param endTime The end time of the surgery
 * @returns Whether the surgeon is available
 */
export async function checkSurgeonAvailability(
  surgeonId: string,
  hospitalId: string,
  date: Date,
  startTime: string,
  endTime: string,
): Promise<boolean> {
  try {
    // Convert selected times to Date objects
    const [startHours, startMinutes] = startTime.split(":").map(Number)
    const [endHours, endMinutes] = endTime.split(":").map(Number)

    const startDateTime = new Date(date)
    startDateTime.setHours(startHours, startMinutes, 0, 0)

    const endDateTime = new Date(date)
    endDateTime.setHours(endHours, endMinutes, 0, 0)

    // Query surgeries for this surgeon on this date
    const surgeriesRef = collection(db, "surgeries")
    const surgeriesQuery = query(
      surgeriesRef,
      where("surgeonId", "==", surgeonId),
      where("hospitalId", "==", hospitalId),
      where("date", ">=", startDateTime.toISOString().split("T")[0]),
      where("status", "==", "scheduled"),
    )

    const surgeriesSnapshot = await getDocs(surgeriesQuery)

    // Check if any surgeries overlap with the requested time
    for (const doc of surgeriesSnapshot.docs) {
      const surgery = doc.data() as Surgery
      const surgeryDate = new Date(surgery.date)
      const surgeryEndTime = new Date(surgeryDate.getTime() + surgery.estimatedDuration * 60000)

      // Check if this surgery overlaps with the requested time
      const overlaps =
        (surgeryDate <= startDateTime && surgeryEndTime > startDateTime) || // Surgery starts before and ends after our start
        (surgeryDate >= startDateTime && surgeryDate < endDateTime) // Surgery starts during our time slot

      if (overlaps) {
        return false // Surgeon is not available
      }
    }

    return true // Surgeon is available
  } catch (error) {
    console.error("Error checking surgeon availability:", error)
    return false // Assume not available in case of error
  }
}

