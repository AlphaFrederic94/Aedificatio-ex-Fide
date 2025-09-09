"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, User, Star, Archive, Flag } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function MessagingSystem() {
  const { user, getAuthHeaders } = useAuth()
  const [messages, setMessages] = useState([])
  const [stats, setStats] = useState({ unread: 0, today: 0, active: 0 })
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [contacts, setContacts] = useState([])
  const [messageForm, setMessageForm] = useState({ recipientId: "", subject: "", content: "" })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchMessages()
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

  const fetchMessages = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch('/api/messages', { headers })
      if (response.ok) {
        const data = await response.json()
        setMessages(data)

        // Calculate stats
        const unread = data.filter((m: any) => !m.isRead).length
        const today = data.filter((m: any) => {
          const msgDate = new Date(m.createdAt).toDateString()
          const todayDate = new Date().toDateString()
          return msgDate === todayDate
        }).length

        setStats({ unread, today, active: data.length })
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleMessageAction = async (messageId: string, action: string, value?: boolean) => {
    try {
      const headers = getAuthHeaders()
      const body: any = {}
      if (action === 'star') body.isStarred = value
      if (action === 'archive') body.isArchived = value
      if (action === 'flag') body.flaggedToAdmin = value

      await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      fetchMessages() // Refresh
    } catch (error) {
      console.error('Failed to update message:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageForm.recipientId || !messageForm.subject || !messageForm.content) return

    setSending(true)
    try {
      const headers = getAuthHeaders()
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(messageForm)
      })

      if (response.ok) {
        setShowComposer(false)
        setMessageForm({ recipientId: "", subject: "", content: "" })
        fetchMessages()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button className="gap-2" onClick={() => setShowComposer(true)}>
          <Send className="h-4 w-4" />
          New Message
        </Button>
      </div>

      {/* Message Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Sent and received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">All conversations</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages yet. Start a conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message: any) => {
                const isSentByMe = message.senderId === user?.id
                const displayName = isSentByMe ? message.recipient?.name : message.sender?.name
                const displayRole = isSentByMe ? message.recipient?.role : message.sender?.role

                return (
                  <div key={message.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {getInitials(displayName || 'Unknown')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {isSentByMe ? `To: ${displayName}` : displayName}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {displayRole}
                        </Badge>
                        {isSentByMe && (
                          <Badge variant="outline" className="text-xs">
                            Sent
                          </Badge>
                        )}
                        {!isSentByMe && !message.isRead && <Badge className="bg-orange-600">New</Badge>}
                      </div>
                      <p className="text-sm font-medium">{message.subject}</p>
                      <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                      <p className="text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMessageAction(message.id, 'star', !message.isStarred)
                      }}
                    >
                      <Star className={`h-4 w-4 ${message.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMessageAction(message.id, 'archive', !message.isArchived)
                      }}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMessageAction(message.id, 'flag', !message.flaggedToAdmin)
                      }}
                    >
                      <Flag className={`h-4 w-4 ${message.flaggedToAdmin ? 'text-red-600' : ''}`} />
                    </Button>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Composer Dialog */}
      <Dialog open={showComposer} onOpenChange={setShowComposer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              New Message
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="text-sm font-medium">To:</label>
              <Select
                value={messageForm.recipientId}
                onValueChange={(value) => setMessageForm(prev => ({ ...prev, recipientId: value }))}
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
                value={messageForm.subject}
                onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter subject..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message:</label>
              <Textarea
                value={messageForm.content}
                onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Type your message..."
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowComposer(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sending || !messageForm.recipientId || !messageForm.subject || !messageForm.content}>
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
