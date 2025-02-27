"use client"

import { useState, useEffect } from "react"

type Surgery = {
  id: string
  patientName: string
  surgeryType: string
  date: string
  time: string
  hospital: string
}

export default function AssignedSurgeries() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([])

  useEffect(() => {
    // In a real application, you would fetch the assigned surgeries from your backend
    setSurgeries([
      {
        id: "1",
        patientName: "John Doe",
        surgeryType: "Type A",
        date: "2023-06-01",
        time: "09:00",
        hospital: "Hospital A",
      },
      {
        id: "2",
        patientName: "Jane Smith",
        surgeryType: "Type B",
        date: "2023-06-02",
        time: "14:00",
        hospital: "Hospital B",
      },
    ])
  }, [])

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-gray-900">Assigned Surgeries</h3>
      <ul className="mt-2 divide-y divide-gray-200">
        {surgeries.map((surgery) => (
          <li key={surgery.id} className="py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{surgery.patientName}</p>
                <p className="text-sm text-gray-500 truncate">
                  {surgery.surgeryType} - {surgery.date} at {surgery.time}
                </p>
                <p className="text-sm text-gray-500 truncate">{surgery.hospital}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

