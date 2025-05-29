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

    const userMessage: JournalEntry = {
      id: Date.now().toString(),
      text: currentText,
      timestamp: new Date(),
      mode: isEmotionalMode ? "emotional" : "record",
    }

    setEntries((prev) => [...prev, userMessage])
    setPrompts((prev) => [...prev, currentText])
    setCurrentText("")

    try {
      const res = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({ message: userMessage.text }),
      })

      const data = await res.json()

      const botMessage: JournalEntry = {
        id: Date.now().toString() + "_bot",
        text: data.reply,
        timestamp: new Date(),
        mode: userMessage.mode,
      }

      setEntries((prev) => [...prev, botMessage])
    } catch (err) {
      console.error("Error getting AI reply:", err)
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
      {/* 사이드 메뉴 생략 (동일) */}

      <div className="container mx-auto px-4 py-8 pt-20 h-screen flex flex-col">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto flex-1 min-h-0">
          {/* 왼쪽: 대화형 프롬프트 */}
          <div className="flex flex-col h-full">
            <Card className="bg-slate-800/60 backdrop-blur-sm border-blue-700/50 shadow-lg flex-1 flex flex-col min-h-0">
              <CardHeader><CardTitle className="text-xl">🌙 Midnight Journal</CardTitle></CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {entries.map((entry) => (
                    <div key={entry.id} className={`flex ${entry.id.includes("bot") ? "justify-start" : "justify-end"}`}>
                      <div className="max-w-[80%]">
                        <div className={`rounded-2xl px-4 py-3 shadow-sm ${entry.id.includes("bot") ? "bg-purple-700 text-white" : "bg-blue-600 text-white"}`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 text-right">{formatTime(entry.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="pt-4 border-t border-blue-700/30 space-y-3">
                  <div className="flex justify-center space-x-3">
                    <Label htmlFor="mode-toggle" className="text-sm">📝 Record</Label>
                    <Switch id="mode-toggle" checked={isEmotionalMode} onCheckedChange={setIsEmotionalMode} className="data-[state=checked]:bg-blue-600" />
                    <Label htmlFor="mode-toggle" className="text-sm">💭 Emotional</Label>
                  </div>

                  <div className="flex space-x-2">
                    <Textarea
                      placeholder={isEmotionalMode ? "How are you feeling?" : "What happened today?"}
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 min-h-[60px] max-h-[120px] resize-none bg-slate-700/60 border-blue-600/50 text-slate-200"
                    />
                    <Button onClick={handleSubmit} disabled={!currentText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-center pt-2">
                    <Button onClick={handleGenerateDiary} disabled={prompts.length === 0} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl">
                      <Sparkles className="h-4 w-4" /> Generate Diary
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 요약 다이어리 */}
          <div className="flex flex-col h-full">
            <Card className="bg-slate-800/60 backdrop-blur-sm border-blue-700/50 shadow-lg flex-1">
              <CardHeader><CardTitle className="text-xl">📔 AI Insights</CardTitle></CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {summary ? (
                  <div className="text-slate-300 whitespace-pre-wrap">{summary}</div>
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
