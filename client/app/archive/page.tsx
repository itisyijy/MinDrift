"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, MessageCircle, User, LogOut, FileText, BookOpen, Loader2, Edit2, Trash2 } from "lucide-react"

interface ChatRecord {
  role: "user" | "assistant"
  content: string
  created_at?: string
}

interface DiaryData {
  summary: string
  content: string
  created_at: string
}

interface ArchiveResponse {
  date: string
  messages: ChatRecord[]
  diary: DiaryData | null
}

export default function ArchivePage() {
  const router = useRouter()
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [archiveData, setArchiveData] = useState<ArchiveResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<{ username: string } | null>(null)
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<{ 
    isOpen: boolean
    date: string
    title: string
  } | null>(null)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("jwt")
        if (token) {
          // JWT 토큰에서 사용자 정보 추출 (토큰 디코딩)
          const payload = JSON.parse(atob(token.split(".")[1]))
          setUserInfo({ username: payload.username || payload.user_id || "User" })
        }
      } catch (err) {
        console.error("Failed to decode token:", err)
        setUserInfo({ username: "User" })
      }
    }

    const fetchDates = async () => {
      try {
        const token = localStorage.getItem("jwt")
        const res = await fetch("http://localhost:8080/api/diary/dates", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) throw new Error(await res.text())

        const data = await res.json()
        setDates(data.dates)

        // 가장 최신 날짜를 자동 선택
        if (data.dates.length > 0) {
          fetchArchive(data.dates[0])
        }
      } catch (err: any) {
        console.error(err)
        setError("일기 날짜 불러오기 실패")
      }
    }

    fetchUserInfo()
    fetchDates()
  }, [])

  const fetchArchive = async (date: string) => {
    setIsLoading(true)
    setSelectedDate(date)
    setError(null)

    try {
      const token = localStorage.getItem("jwt")
      const res = await fetch(`http://localhost:8080/api/diary/archive?date=${date}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setArchiveData(data)
    } catch (err: any) {
      console.error(err)
      setError("일기 불러오기 실패")
    } finally {
      setIsLoading(false)
    }
  }

    // 일기 삭제 함수
  const deleteDiaryByDate = async (date: string) => {
    try {
      // 2. 삭제 확인 팝업 (영어로)
      const dateObj = new Date(date)
      const monthName = dateObj.toLocaleDateString("en-US", { month: "long" })
      const day = dateObj.getDate()

      // 커스텀 다이얼로그 열기
      setDeleteConfirm({
        isOpen: true,
        date: date,
        title: `${monthName} ${day}`,
      })
    } catch (err) {
      console.error("Delete diary error:", err)
      alert("Network error occurred")
    }
  }

   const confirmDelete = async (date: string) => {
      try {
        const token = localStorage.getItem("jwt")
  
        // 1. 날짜로 일기 ID 조회
        const res = await fetch(`http://localhost:8080/api/diary/id-by-date?date=${date}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
  
        if (!res.ok) {
          alert("Failed to fetch diary ID")
          return
        }
  
        const { id } = await res.json()
  
        // 3. 실제 삭제 요청
        const delRes = await fetch(`http://localhost:8080/api/diary/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
  
        const result = await delRes.json()
  
        if (delRes.ok) {
          alert("✅ Diary deleted successfully")
  
          // 4. 목록 갱신
          const updatedDates = dates.filter((d) => d !== date)
          setDates(updatedDates)
  
          // 삭제된 일기가 현재 선택된 일기라면 다른 일기 선택
          if (selectedDate === date) {
            if (updatedDates.length > 0) {
              fetchArchive(updatedDates[0])
            } else {
              setSelectedDate(null)
              setArchiveData(null)
            }
          }
        } else {
          alert("❌ Failed to delete diary: " + (result.error || "Unknown error"))
        }
      } catch (err) {
        console.error("Delete diary error:", err)
        alert("Network error occurred")
      }
  }

  // 채팅 페이지로 이동
  const handleChatPageClick = () => {
    router.push("/chat")
  }

  // 로그아웃 처리
  const handleLogout = () => {
    try {
      // localStorage에서 JWT 토큰 제거
      localStorage.removeItem("jwt")

      // 로그인 페이지로 리다이렉트
      router.push("/login")
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }
  const createMarkup = (html: string) => ({ __html: html })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    })
  }

  const generateDiaryTitle = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 일기`
  }

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) {
      alert("사용자명을 입력해주세요.")
      return
    }

    try {
      const token = localStorage.getItem("jwt")
      const res = await fetch("http://localhost:8080/auth/username", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newUsername: newUsername.trim() }),
      })

      if (!res.ok) {
        const msg = await res.text()
        alert(`변경 실패: ${msg}`)
        return
      }

      const data = await res.json()
      setUserInfo({ username: data.newUsername })
      setIsEditingUsername(false)
      setNewUsername("")
      alert("사용자명이 성공적으로 변경되었습니다!")
    } catch (err) {
      console.error("Username change error:", err)
      alert("네트워크 오류가 발생했습니다.")
    }
  }

  const handleEditClick = () => {
    setNewUsername(userInfo?.username || "")
    setIsEditingUsername(true)
  }

  const handleCancelEdit = () => {
    setIsEditingUsername(false)
    setNewUsername("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex">
      {/* 왼쪽 사이드바 */}
      <div className="w-80 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 flex flex-col">
        {/* 사용자 프로필 */}
<div className="p-6 border-b border-slate-700/50">
  <div className="flex items-center space-x-3">
    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
      <User className="w-5 h-5 text-white" />
    </div>
    <div className="flex-1">
      {isEditingUsername ? (
        <div className="space-y-2">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="w-full px-2 py-1 text-sm bg-slate-700 text-white border border-slate-600 rounded focus:outline-none focus:border-blue-500"
            placeholder="새 사용자명 입력"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUsernameChange()
              if (e.key === "Escape") handleCancelEdit()
            }}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleUsernameChange}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              저장
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-2 py-1 text-xs bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <div>
            <h3 className="text-white font-medium">{userInfo?.username || "Loading..."}</h3>
            <p className="text-slate-400 text-sm">Welcome back!</p>
          </div>
          <button
            onClick={handleEditClick}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="사용자명 변경"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  </div>
</div>

        {/* 네비게이션 */}
        <div className="p-4 border-b border-slate-700/50">
          <nav className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
              onClick={handleChatPageClick}
            >
            <FileText className="w-4 h-4 mr-3" />
              Chat Page
            </Button>
            <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
              <BookOpen className="w-4 h-4 mr-3" />
              Recent Logs
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Log out
            </Button>
          </nav>
        </div>

        {/* 일기 목록 */}
        <div className="flex-1 p-4">
          <h4 className="text-slate-300 font-medium mb-4 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            일기 목록 ({dates.length})
          </h4>
          <ScrollArea className="h-full">
            <div className="space-y-3">
              {dates.map((date) => (
                <Card
                  key={date}
                  className={`transition-all duration-200 ${
                    selectedDate === date
                      ? "bg-blue-600/20 border-blue-500/50 shadow-lg"
                      : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/30 hover:border-slate-600/50"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => fetchArchive(date)}
                      >
                        <div className="flex items-center space-x-2 flex-1">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          <p className="text-white text-sm font-medium">{generateDiaryTitle(date)}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation() // 카드 클릭 이벤트 방지
                            deleteDiaryByDate(date)
                          }}
                          className="p-1 text-gray-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                          title="Delete diary"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-slate-400 text-xs">{formatDate(date)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 p-8 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* 헤더 */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">📚 일기 아카이브</h1>
            <p className="text-slate-400">AI가 작성해준 소중한 일기들을 확인해보세요</p>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center space-x-2 text-white">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>일기를 불러오는 중...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-400 mb-4">{error}</div>
                <Button onClick={() => window.location.reload()} variant="outline">
                  다시 시도
                </Button>
              </div>
            </div>
          ) : archiveData?.diary ? (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
              {/* AI 일기 내용 */}
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <span>🤖</span>
                    <span>AI 일기</span>
                  </CardTitle>
                  <p className="text-slate-400 text-sm">{formatDate(selectedDate || "")}</p>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="bg-slate-900/50 rounded-lg p-6">
                      <div
                        className="text-slate-200 leading-relaxed prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={createMarkup(archiveData.diary.summary)}
                      />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* 채팅 기록 */}
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5" />
                    <span>채팅 기록</span>
                  </CardTitle>
                  <p className="text-slate-400 text-sm">{archiveData.messages.length}개의 대화</p>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      {archiveData.messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[80%]">
                            <div
                              className={`px-4 py-3 rounded-lg ${
                                msg.role === "user" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-200"
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                            </div>
                            {msg.created_at && (
                              <p className="text-xs text-slate-500 mt-1 px-1">
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>일기를 선택해주세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 삭제 확인 다이얼로그 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <h3 className="text-white text-lg font-semibold mb-4">Delete Diary</h3>
            <p className="text-slate-300 mb-6">Do you want to delete the diary for {deleteConfirm.title}?</p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await confirmDelete(deleteConfirm.date)
                  setDeleteConfirm(null)
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
