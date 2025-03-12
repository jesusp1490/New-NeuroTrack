"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AdditionalEmailRecipientsProps {
  recipients: string[]
  onChange: (recipients: string[]) => void
}

export default function AdditionalEmailRecipients({ recipients, onChange }: AdditionalEmailRecipientsProps) {
  const [newEmail, setNewEmail] = useState("")
  const [error, setError] = useState("")

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const addRecipient = () => {
    if (!newEmail) {
      setError("Por favor ingrese un correo electrónico")
      return
    }

    if (!validateEmail(newEmail)) {
      setError("Por favor ingrese un correo electrónico válido")
      return
    }

    if (recipients.includes(newEmail)) {
      setError("Este correo ya ha sido agregado")
      return
    }

    onChange([...recipients, newEmail])
    setNewEmail("")
    setError("")
  }

  const removeRecipient = (email: string) => {
    onChange(recipients.filter((r) => r !== email))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Destinatarios Adicionales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="additional-email">Agregar correo electrónico</Label>
            <div className="flex space-x-2">
              <Input
                id="additional-email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value)
                  setError("")
                }}
                className={error ? "border-red-500" : ""}
              />
              <Button type="button" onClick={addRecipient} size="icon">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {recipients.length > 0 && (
            <div className="space-y-2">
              <Label>Destinatarios</Label>
              <div className="flex flex-wrap gap-2">
                {recipients.map((email) => (
                  <div
                    key={email}
                    className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      className="ml-2 text-primary hover:text-primary/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

