"use client"

import { useState, useEffect } from "react"
import { StudentLayout } from "@/components/layout/student-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, User, Star, Archive, Flag } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function StudentMessagesPage() {
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
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
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
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading messages...</div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-2">Communicate with your teachers and classmates.</p>
          </div>
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
              <p className="text-xs text-muted-foreground">New messages</p>
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
              <p className="text-xs text-muted-foreground">In your inbox</p>
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
                          {message.isStarred && <Star className="h-3 w-3 text-yellow-500" />}
                          {message.flaggedToAdmin && <Flag className="h-3 w-3 text-red-500" />}
                        </div>
                      <p className="text-sm font-medium">{message.subject}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {message.content.substring(0, 100)}...
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!isSentByMe && !message.isRead && <Badge className="bg-orange-600">Unread</Badge>}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMessageAction(message.id, 'star', !message.isStarred)
                          }}
                        >
                          <Star className={`h-3 w-3 ${message.isStarred ? 'text-yellow-500' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMessageAction(message.id, 'archive', true)
                          }}
                        >
                          <Archive className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMessageAction(message.id, 'flag', !message.flaggedToAdmin)
                          }}
                        >
                          <Flag className={`h-3 w-3 ${message.flaggedToAdmin ? 'text-red-500' : ''}`} />
                        </Button>
                      </div>
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
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Message:</label>
                <Textarea
                  value={messageForm.content}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Type your message..."
                  rows={8}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowComposer(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  )
}
