"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Menu, X, User, FileText, LogOut, Send, Sparkles } from "lucide-react"

interface JournalEntry {
  id: string
  text: string
  timestamp: Date
  mode: "emotional" | "record"
  reply?: string
}

export default function AIDiaryChatInterface() {
  const [username, setUsername] = useState("Alex")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEmotionalMode, setIsEmotionalMode] = useState(true)
  const [currentText, setCurrentText] = useState("")
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [prompts, setPrompts] = useState<string[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    if (storedUsername) setUsername(storedUsername)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [entries])

  const handleSubmit = async () => {
    if (!currentText.trim()) return

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      text: currentText,
      timestamp: new Date(),
      mode: isEmotionalMode ? "emotional" : "record",
    }

    setEntries((prev) => [...prev, newEntry])
    setPrompts((prev) => [...prev, currentText])
    setCurrentText("")

    try {
      const res = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({ message: newEntry.text }),
      })

      const data = await res.json()

      const botReply: JournalEntry = {
        id: Date.now().toString() + "_bot",
        text: data.reply,
        timestamp: new Date(),
        mode: newEntry.mode,
      }

      setEntries((prev) => [...prev, botReply])
    } catch (err) {
      console.error("AI response error:", err)
    }
  }

  const handleGenerateDiary = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/diary/from-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        alert("Diary generation failed: " + errorText)
        return
      }

      const data = await response.json()
      alert("✅ Diary generated!")
      setPrompts([])
      setSummary(data.reply)
    } catch (err) {
      console.error(err)
      alert("Error while generating diary")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const formatTime = (date: Date) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-slate-200 transition-all duration-500">
      <div className="fixed top-4 left-4 z-50">
        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-full hover:bg-blue-800/50 text-slate-200">
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <div className={`fixed top-0 left-0 h-full w-80 transform transition-transform duration-300 z-40 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} bg-slate-900/95 backdrop-blur-md border-r border-blue-800/50`}>
        <div className="p-6 pt-20">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-800/50">
                <User className="h-6 w-6 text-blue-200" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">{username}</h3>
                <p className="text-sm text-slate-400">Welcome back!</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-slate-200 hover:bg-blue-700/60 hover:text-slate-200">
              <FileText className="mr-3 h-4 w-4" />
              Archive
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-200 hover:bg-blue-700/60 hover:text-slate-200" onClick={() => {
              localStorage.removeItem("jwt")
              localStorage.removeItem("username")
              window.location.href = "/login"
            }}>
              <LogOut className="mr-3 h-4 w-4" />
              Log out
            </Button>
          </nav>
        </div>
      </div>

      {isMenuOpen && <div className="fixed inset-0 bg-black/20 z-30" onClick={() => setIsMenuOpen(false)} />}

      <div className="container mx-auto px-4 py-8 pt-20 h-screen flex flex-col">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto flex-1 min-h-0">
          <div className="flex flex-col h-full">
            <Card className="bg-slate-800/60 backdrop-blur-sm border-blue-700/50 shadow-lg flex-1 flex flex-col min-h-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-xl font-semibold text-slate-200">🌙 Midnight Journal</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {entries.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-lg mb-2">Start your journal entry...</p>
                      <p className="text-sm">Share your thoughts, feelings, or record your day</p>
                    </div>
                  ) : (
                    entries.map((entry) => (
                      <div key={entry.id} className={`flex ${entry.id.includes("bot") ? "justify-start" : "justify-end"}`}>
                        <div className="max-w-[80%]">
                          <div className={`rounded-2xl px-4 py-3 shadow-sm ${entry.id.includes("bot") ? "bg-purple-700 text-white" : "bg-blue-600 text-white"}`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                          </div>
                          <div className="flex items-center justify-end mt-1 space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${entry.mode === "emotional" ? "bg-purple-900/50 text-purple-300" : "bg-blue-900/50 text-blue-300"}`}>
                              {entry.mode === "emotional" ? "💭 Emotional" : "📝 Record"}
                            </span>
                            <span className="text-xs text-slate-400">{formatTime(entry.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex-shrink-0 space-y-3 pt-4 border-t border-blue-700/30">
                  <div className="flex items-center justify-center space-x-3">
                    <Label htmlFor="mode-toggle" className="text-sm font-medium text-slate-300">
                      📝 Record
                    </Label>
                    <Switch
                      id="mode-toggle"
                      checked={isEmotionalMode}
                      onCheckedChange={setIsEmotionalMode}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <Label htmlFor="mode-toggle" className="text-sm font-medium text-slate-300">
                      💭 Emotional
                    </Label>
                  </div>

                  <div className="flex space-x-2">
                    <Textarea
                      placeholder={isEmotionalMode ? "How are you feeling right now..." : "What happened today..."}
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 min-h-[60px] max-h-[120px] resize-none rounded-xl bg-slate-700/60 border-blue-600/50 focus:border-blue-500 text-slate-200 placeholder:text-slate-400"
                    />
                    <Button
                      onClick={handleSubmit}
                      disabled={!currentText.trim()}
                      className="self-end rounded-xl bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 text-white transition-all duration-200"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-center pt-2">
                    <Button
                      onClick={handleGenerateDiary}
                      disabled={prompts.length === 0}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Diary</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col h-full">
            <Card className="bg-slate-800/60 backdrop-blur-sm border-blue-700/50 shadow-lg flex-1">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-200">📕Diary</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {summary ? (
                  <div
                    className="text-slate-300"
                    dangerouslySetInnerHTML={{ __html: summary }}
                  />
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">AI insights will appear here after you generate your diary</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
