"use client"

import { useState } from "react"

const hospitals = [
  "Hospital A",
  "Hospital B",
  "Hospital C",
  // Add more hospitals as needed
]

export default function HospitalSelector() {
  const [selectedHospital, setSelectedHospital] = useState(hospitals[0])

  return (
    <div className="mb-4">
      <label htmlFor="hospital-select" className="block text-sm font-medium text-gray-700">
        Select Hospital
      </label>
      <select
        id="hospital-select"
        value={selectedHospital}
        onChange={(e) => setSelectedHospital(e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        {hospitals.map((hospital) => (
          <option key={hospital} value={hospital}>
            {hospital}
          </option>
        ))}
      </select>
    </div>
  )
}

