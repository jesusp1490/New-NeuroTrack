import type { SurgeryMaterial } from "@/types"
import { surgeryTypes } from "@/lib/surgeryTypes"

/**
 * Get materials for a specific surgery type
 * @param surgeryTypeIdOrName The ID or name of the surgery type
 * @returns Array of materials for the surgery type, or empty array if not found
 */
export function getMaterialsForSurgeryType(surgeryTypeIdOrName: string): SurgeryMaterial[] {
  // Try to find the surgery type by ID or name
  const surgeryType = surgeryTypes.find((type) => type.id === surgeryTypeIdOrName || type.name === surgeryTypeIdOrName)

  // Return the materials if found, otherwise empty array
  return surgeryType?.materials || []
}

