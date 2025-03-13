/**
 * Save the selected hospital to localStorage
 */
export function saveSelectedHospital(hospitalId: string, hospitalName: string) {
  try {
    localStorage.setItem("selectedHospital", hospitalId)
    localStorage.setItem("selectedHospitalName", hospitalName)
    console.log(`Hospital saved to localStorage: ${hospitalId} (${hospitalName})`)
  } catch (error) {
    console.error("Error saving hospital to localStorage:", error)
  }
}

/**
 * Get the selected hospital from localStorage
 */
export function getSelectedHospital(): { id: string; name: string } | null {
  try {
    const id = localStorage.getItem("selectedHospital")
    const name = localStorage.getItem("selectedHospitalName")

    if (id && name) {
      return { id, name }
    }
    return null
  } catch (error) {
    console.error("Error getting hospital from localStorage:", error)
    return null
  }
}

