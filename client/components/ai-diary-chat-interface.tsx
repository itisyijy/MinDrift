interface JournalEntry {
    id: string
    text: string
    timestamp: Date
    mode: 'emotional' | 'record'
  }

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Menu, X, User, FileText, LogOut, Send } from "lucide-react"
import { useRouter } from "next/navigation" // ✅ 라우터 훅 추가

export default function AIDiaryChatInterface() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEmotionalMode, setIsEmotionalMode] = useState(true)
  const [currentText, setCurrentText] = useState("")
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter() // useRouter 선언

  // Scroll to bottom when new entries are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [entries])

  const handleSubmit = () => {
    if (!currentText.trim()) return

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      text: currentText,
      timestamp: new Date(),
      mode: isEmotionalMode ? "emotional" : "record",
    }

    setEntries((prev) => [...prev, newEntry])
    setCurrentText("")
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-slate-200 transition-all duration-500">
      {/* Hamburger Menu */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-full hover:bg-blue-800/50 text-slate-200"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Side Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 transform transition-transform duration-300 z-40 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } bg-slate-900/95 backdrop-blur-md border-r border-blue-800/50`}
      >
        <div className="p-6 pt-20">
          {/* Profile Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-800/50">
                <User className="h-6 w-6 text-blue-200" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Alex</h3>
                <p className="text-sm text-slate-400">Welcome back!</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start hover:bg-blue-800/30 text-slate-200">
              <User className="mr-3 h-4 w-4" />
              My Page
            </Button>
            <Button variant="ghost" className="w-full justify-start hover:bg-blue-800/30 text-slate-200"
            onClick={() => router.push("/archive")} // ✅ 아카이브 페이지로 이동
            > <FileText className="mr-3 h-4 w-4" />
            Recent Logs
            </Button>
            <Button variant="ghost" className="w-full justify-start hover:bg-blue-800/30 text-slate-200">
              <LogOut className="mr-3 h-4 w-4" />
              Log out
            </Button>
          </nav>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/20 z-30" onClick={() => setIsMenuOpen(false)} />}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 pt-20 h-screen flex flex-col">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto flex-1 min-h-0">
          {/* Left Column - Chat Interface */}
          <div className="flex flex-col h-full">
            <Card className="bg-slate-800/60 backdrop-blur-sm border-blue-700/50 shadow-lg flex-1 flex flex-col min-h-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-xl font-semibold text-slate-200">🌙 Midnight Journal</CardTitle>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {entries.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-lg mb-2">Start your journal entry...</p>
                      <p className="text-sm">Share your thoughts, feelings, or record your day</p>
                    </div>
                  ) : (
                    entries.map((entry) => (
                      <div key={entry.id} className="flex justify-end">
                        <div className="max-w-[80%]">
                          <div className="rounded-2xl rounded-br-md px-4 py-3 bg-blue-600 text-white shadow-sm">
                            <p className="text-sm leading-relaxed">{entry.text}</p>
                          </div>
                          <div className="flex items-center justify-end mt-1 space-x-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                entry.mode === "emotional"
                                  ? "bg-purple-900/50 text-purple-300"
                                  : "bg-blue-900/50 text-blue-300"
                              }`}
                            >
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

                {/* Input Area */}
                <div className="flex-shrink-0 space-y-3 pt-4 border-t border-blue-700/30">
                  {/* Mode Toggle */}
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

                  {/* Text Input */}
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Summary */}
          <div className="flex flex-col h-full">
            <Card className="bg-slate-800/60 backdrop-blur-sm border-blue-700/50 shadow-lg flex-1">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-200">🤖 AI Insights</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {entries.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">AI insights will appear here after you start journaling</p>
                  </div>
                ) : (
                  <>
                    {/* Summary Paragraph */}
                    <div>
                      <h3 className="font-medium mb-2 text-slate-200">📊 Summary</h3>
                      <p className="text-sm leading-relaxed text-slate-300">
                        Based on your recent entries, you've been reflecting on personal growth and daily experiences.
                        Your journal shows a balance between emotional processing and factual recording of events.
                      </p>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h3 className="font-medium mb-3 text-slate-200">⏰ Timeline</h3>
                      <ul className="space-y-2">
                        <li className="flex items-center text-sm text-slate-300">
                          <span className="w-2 h-2 rounded-full mr-3 bg-blue-400"></span>
                          Started journaling session
                        </li>
                        <li className="flex items-center text-sm text-slate-300">
                          <span className="w-2 h-2 rounded-full mr-3 bg-blue-400"></span>
                          Shared {entries.filter((e) => e.mode === "emotional").length} emotional thoughts
                        </li>
                        <li className="flex items-center text-sm text-slate-300">
                          <span className="w-2 h-2 rounded-full mr-3 bg-blue-400"></span>
                          Recorded {entries.filter((e) => e.mode === "record").length} daily events
                        </li>
                        <li className="flex items-center text-sm text-slate-300">
                          <span className="w-2 h-2 rounded-full mr-3 bg-blue-400"></span>
                          Total entries: {entries.length}
                        </li>
                      </ul>
                    </div>

                    {/* Emotion */}
                    <div>
                      <h3 className="font-medium mb-2 text-slate-200">😊 Current Mood</h3>
                      <div className="text-4xl">😌</div>
                      <p className="text-sm mt-1 text-slate-400">Reflective & Thoughtful</p>
                    </div>

                    {/* Quote */}
                    <div className="p-4 rounded-xl bg-blue-900/30 border-l-4 border-blue-500">
                      <p className="text-sm italic text-blue-200">
                        "Every journal entry is a step towards understanding yourself better."
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}