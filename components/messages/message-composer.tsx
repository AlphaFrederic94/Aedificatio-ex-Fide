"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Send } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface MessageComposerProps {
  onClose: () => void
  onSent: () => void
  replyTo?: {
    id: string
    sender: { name: string }
    subject: string
  }
}

export function MessageComposer({ onClose, onSent, replyTo }: MessageComposerProps) {
  const { getAuthHeaders } = useAuth()
  const [contacts, setContacts] = useState([])
  const [formData, setFormData] = useState({
    recipientId: "",
    subject: replyTo ? `Re: ${replyTo.subject}` : "",
    content: ""
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch('/api/messages/users/contacts', { headers })
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.recipientId || !formData.subject || !formData.content) return

    setLoading(true)
    try {
      const headers = getAuthHeaders()
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSent()
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {replyTo ? `Reply to ${replyTo.sender.name}` : 'New Message'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">To:</label>
              <Select
                value={formData.recipientId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, recipientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact: any) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} ({contact.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Subject:</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter subject..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Message:</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Type your message..."
                rows={8}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
