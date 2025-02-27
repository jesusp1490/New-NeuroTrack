import React from "react"
import { useState } from "react"

type Shift = {
  id: string
  date: string
  startTime: string
  endTime: string
}

export default function NeurofisiologoShiftManager() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [newShift, setNewShift] = useState<Omit<Shift, "id">>({
    date: "",
    startTime: "",
    endTime: "",
  })

  const addShift = (e: React.FormEvent) => {
    e.preventDefault()
    const shift: Shift = {
      id: Date.now().toString(),
      ...newShift,
    }
    setShifts([...shifts, shift])
    setNewShift({ date: "", startTime: "", endTime: "" })
  }

  const removeShift = (id: string) => {
    setShifts(shifts.filter((shift) => shift.id !== id))
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-gray-900">Manage Shifts</h3>
      <form onSubmit={addShift} className="mt-2 space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={newShift.date}
            onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
            Start Time
          </label>
          <input
            type="time"
            id="startTime"
            value={newShift.startTime}
            onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
            End Time
          </label>
          <input
            type="time"
            id="endTime"
            value={newShift.endTime}
            onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Shift
        </button>
      </form>
      <ul className="mt-4 divide-y divide-gray-200">
        {shifts.map((shift) => (
          <li key={shift.id} className="py-4 flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{shift.date}</p>
              <p className="text-sm text-gray-500">
                {shift.startTime} - {shift.endTime}
              </p>
            </div>
            <button onClick={() => removeShift(shift.id)} className="text-red-600 hover:text-red-800">
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

