"use client"

import { useState, useEffect } from "react"

type Notification = {
  id: string
  message: string
  read: boolean
}

export default function NotificationHandler() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    // Fetch notifications from your backend or Firebase
    // This is a placeholder implementation
    setNotifications([
      { id: "1", message: "New surgery scheduled", read: false },
      { id: "2", message: "Shift change request", read: false },
    ])
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
      <ul className="mt-2 divide-y divide-gray-200">
        {notifications.map((notification) => (
          <li key={notification.id} className="py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium text-gray-900 ${notification.read ? "opacity-50" : ""}`}>
                  {notification.message}
                </p>
              </div>
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Mark as read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

