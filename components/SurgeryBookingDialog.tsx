"use client"

import React from "react"
import { useState } from "react"

export default function SurgeryBookingDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [surgeryType, setSurgeryType] = useState("")
  const [duration, setDuration] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle the surgery booking logic here
    console.log("Surgery booked:", { surgeryType, duration, notes })
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Book Surgery
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Book a Surgery</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="surgery-type" className="block text-sm font-medium text-gray-700">
                  Surgery Type
                </label>
                <select
                  id="surgery-type"
                  value={surgeryType}
                  onChange={(e) => setSurgeryType(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">Select a surgery type</option>
                  <option value="type1">Surgery Type 1</option>
                  <option value="type2">Surgery Type 2</option>
                  <option value="type3">Surgery Type 3</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  rows={3}
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

