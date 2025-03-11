"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "../app/hooks/use-toast"

export default function EmailTester() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const sendTestEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const docRef = await addDoc(collection(db, "mail"), {
        to: email,
        message: {
          subject: "Test Email from NeuroTrack",
          text: "This is a test email to verify the email extension is working.",
          html: "<h1>Test Email</h1><p>This is a test email to verify the email extension is working.</p>",
        },
      })

      toast({
        title: "Success",
        description: `Test email document created with ID: ${docRef.id}`,
      })
    } catch (error) {
      console.error("Error creating test email:", error)
      toast({
        title: "Error",
        description: `Failed to send test email: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Email Extension Tester</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Recipient Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter recipient email"
          />
        </div>
        <Button onClick={sendTestEmail} disabled={loading} className="w-full">
          {loading ? "Sending..." : "Send Test Email"}
        </Button>
      </div>
    </div>
  )
}

