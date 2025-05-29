"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "../../components/ui/scroll-area"
import { Calendar, MessageCircle, User, LogOut, FileText, BookOpen, Loader2 } from "lucide-react"

// 실제 DB 구조에 맞는 타입 정의
interface DiaryEntry {
  id: number
  user_id: number
  content: string | null // 원본 채팅 내용 (JSON 형태일 수 있음)
  summary: string // HTML 형식의 일기 내용
  created_at: string // ISO 8601 형식의 타임스탬프
}

// API 응답 타입
interface DiariesResponse {
  success: boolean
  diaries: DiaryEntry[]
  message?: string
}

// 채팅 기록 타입 (content에서 파싱될 수 있는 형태)
interface ChatRecord {
  role: "user" | "assistant"
  content: string
  timestamp?: string
}

// 실제 DB 형식에 맞는 더미 데이터
const dummyDiaries: DiaryEntry[] = [
  {
    id: 1,
    user_id: 1,
    content: JSON.stringify([
      { role: "user", content: "오늘 새로운 프로젝트를 시작했어. 조금 긴장되지만 기대도 돼.", timestamp: "14:20" },
      {
        role: "assistant",
        content: "새로운 시작은 언제나 설레는 일이에요! 어떤 프로젝트인지 더 자세히 말씀해주세요.",
        timestamp: "14:21",
      },
      {
        role: "user",
        content: "팀 프로젝트인데, 브레인스토밍을 했는데 생각보다 좋은 아이디어들이 많이 나왔어.",
        timestamp: "14:25",
      },
      {
        role: "assistant",
        content: "팀워크가 좋다는 증거네요! 좋은 아이디어들이 나왔다니 정말 기대됩니다.",
        timestamp: "14:26",
      },
      { role: "user", content: "처음엔 걱정이 많았는데, 지금은 기대가 더 커졌어.", timestamp: "14:30" },
    ]),
    summary: `<div class="diary-entry">
      <h2 class="diary-date">2025년 5월 29일</h2>
      <p>오늘은 정말 의미 있는 하루였습니다. 새로운 프로젝트를 시작하면서 설렘과 동시에 약간의 긴장감도 느꼈지만, 팀원들과의 협업을 통해 좋은 아이디어들이 많이 나왔습니다.</p>
      <p>특히 오후에 진행한 브레인스토밍 세션에서는 창의적인 해결책들을 찾을 수 있었고, 이를 통해 프로젝트의 방향성을 명확히 할 수 있었습니다. 새로운 도전에 대한 두려움보다는 기대감이 더 크게 느껴지는 하루였습니다.</p>
    </div>`,
    created_at: "2025-05-29T15:05:33.412Z",
  },
  {
    id: 2,
    user_id: 1,
    content: JSON.stringify([
      { role: "user", content: "오늘은 혼자 조용히 시간을 보냈어. 아침에 산책도 하고.", timestamp: "09:30" },
      { role: "assistant", content: "혼자만의 시간도 정말 소중하죠. 산책은 어떠셨나요?", timestamp: "09:31" },
      { role: "user", content: "맑은 공기 마시니까 기분이 좋아졌어. 오후에는 책도 읽었고.", timestamp: "15:45" },
      { role: "assistant", content: "완벽한 힐링 데이네요! 어떤 책을 읽으셨는지 궁금해요.", timestamp: "15:46" },
    ]),
    summary: `<div class="diary-entry">
      <h2 class="diary-date">2025년 5월 28일</h2>
      <p>오늘은 조용한 하루를 보냈습니다. 아침에 일찍 일어나서 산책을 하며 맑은 공기를 마셨고, 오후에는 좋아하는 책을 읽으며 여유로운 시간을 가졌습니다.</p>
      <p>가끔은 이렇게 혼자만의 시간을 갖는 것도 필요하다는 생각이 들었습니다. 바쁜 일상 속에서 잠시 멈춰 서서 자신을 돌아보는 시간이 얼마나 소중한지 깨달았습니다.</p>
    </div>`,
    created_at: "2025-05-28T21:15:00.000Z",
  },
  {
    id: 3,
    user_id: 1,
    content: JSON.stringify([
      { role: "user", content: "오늘 오랜만에 친구들이랑 만났어! 정말 즐거웠어.", timestamp: "19:20" },
      {
        role: "assistant",
        content: "오랜만에 만난 친구들과의 시간은 정말 특별하죠! 어떤 이야기들을 나누셨나요?",
        timestamp: "19:21",
      },
      {
        role: "user",
        content: "맛있는 거 먹으면서 근황도 나누고, 옛날 이야기도 하고... 웃음이 끊이지 않았어.",
        timestamp: "19:25",
      },
      {
        role: "assistant",
        content: "정말 행복한 하루셨겠어요. 좋은 친구들이 있다는 건 큰 축복이에요!",
        timestamp: "19:26",
      },
    ]),
    summary: `<div class="diary-entry">
      <h2 class="diary-date">2025년 5월 27일</h2>
      <p>친구들과 만나서 즐거운 시간을 보낸 하루였습니다. 오랜만에 만난 친구들과 함께 맛있는 음식을 먹고 이야기를 나누며 웃음이 끊이지 않았습니다.</p>
      <p>바쁜 일상 속에서 이렇게 소중한 사람들과 시간을 보낼 수 있어서 정말 감사했습니다. 우정의 소중함을 다시 한번 느낄 수 있었던 의미 있는 하루였습니다.</p>
    </div>`,
    created_at: "2025-05-27T23:00:00.000Z",
  },
  {
    id: 4,
    user_id: 1,
    content: JSON.stringify([
      { role: "user", content: "오늘 새로운 온라인 강의를 들었어. 처음엔 어려웠는데.", timestamp: "16:30" },
      {
        role: "assistant",
        content: "새로운 것을 배우는 건 항상 도전이죠! 어떤 분야의 강의였나요?",
        timestamp: "16:31",
      },
      { role: "user", content: "프로그래밍 관련 강의였어. 점점 이해되니까 재미있더라.", timestamp: "16:35" },
      {
        role: "assistant",
        content: "프로그래밍은 정말 흥미로운 분야예요! 배움의 즐거움을 느끼고 계시는군요.",
        timestamp: "16:36",
      },
    ]),
    summary: `<div class="diary-entry">
      <h2 class="diary-date">2025년 5월 26일</h2>
      <p>오늘은 새로운 것을 배우는 하루였습니다. 온라인 강의를 들으며 새로운 기술에 대해 공부했는데, 처음에는 어려웠지만 점점 이해가 되면서 재미를 느꼈습니다.</p>
      <p>배움에는 나이가 없다는 말이 정말 맞는 것 같습니다. 새로운 지식을 습득하는 과정에서 느끼는 성취감과 즐거움이 하루를 더욱 의미 있게 만들어주었습니다.</p>
    </div>`,
    created_at: "2025-05-26T20:45:00.000Z",
  },
]

// API 호출 함수들 (실제 구현 시 사용)
const fetchDiaries = async (): Promise<DiariesResponse> => {
  try {
    // 실제 API 호출
    // const response = await fetch('/api/diaries', {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   }
    // })
    // const data = await response.json()
    // return data

    // 현재는 더미 데이터 반환
    return {
      success: true,
      diaries: dummyDiaries,
    }
  } catch (error) {
    console.error("Failed to fetch diaries:", error)
    return {
      success: false,
      diaries: [],
      message: "일기를 불러오는데 실패했습니다.",
    }
  }
}

// HTML 콘텐츠를 안전하게 렌더링하기 위한 함수
const createMarkup = (htmlString: string) => {
  return { __html: htmlString }
}

// 채팅 기록 파싱 함수
const parseChatRecords = (content: string | null): ChatRecord[] => {
  if (!content) return []

  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error("Failed to parse chat records:", error)
    return []
  }
}

// 일기 제목 생성 함수
const generateDiaryTitle = (createdAt: string): string => {
  const date = new Date(createdAt)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 일기`
}

// 텍스트 미리보기 추출 함수 (HTML 태그 제거)
const extractTextPreview = (htmlString: string, maxLength = 50): string => {
  const tempDiv = document.createElement("div")
  tempDiv.innerHTML = htmlString
  const textContent = tempDiv.textContent || tempDiv.innerText || ""
  return textContent.length > maxLength ? textContent.substring(0, maxLength) + "..." : textContent
}

export default function RecentLogsPage() {
  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null)
  const [diaries, setDiaries] = useState<DiaryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDiaries = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchDiaries()

        if (response.success) {
          // created_at 기준으로 최신순 정렬
          const sortedDiaries = response.diaries.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )
          setDiaries(sortedDiaries)

          // 가장 최신 일기를 기본 선택
          if (sortedDiaries.length > 0) {
            setSelectedDiary(sortedDiaries[0])
          }
        } else {
          setError(response.message || "일기를 불러오는데 실패했습니다.")
        }
      } catch (err) {
        setError("네트워크 오류가 발생했습니다.")
        console.error("Error loading diaries:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDiaries()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>일기를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <Button onClick={() => window.location.reload()} variant="outline">
            다시 시도
          </Button>
        </div>
      </div>
    )
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
            <div>
              <h3 className="text-white font-medium">Alex</h3>
              <p className="text-slate-400 text-sm">Welcome back!</p>
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <div className="p-4 border-b border-slate-700/50">
          <nav className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              <FileText className="w-4 h-4 mr-3" />
              My Page
            </Button>
            <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
              <BookOpen className="w-4 h-4 mr-3" />
              Recent Logs
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
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
            일기 목록 ({diaries.length})
          </h4>
          <ScrollArea className="h-full">
            <div className="space-y-3">
              {diaries.map((diary) => (
                <Card
                  key={diary.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedDiary?.id === diary.id
                      ? "bg-blue-600/20 border-blue-500/50 shadow-lg"
                      : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/30 hover:border-slate-600/50"
                  }`}
                  onClick={() => setSelectedDiary(diary)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <p className="text-white text-sm font-medium">{generateDiaryTitle(diary.created_at)}</p>
                      </div>
                      <p className="text-slate-400 text-xs">{formatDate(diary.created_at)}</p>
                      <p className="text-slate-500 text-xs line-clamp-2">{extractTextPreview(diary.summary)}</p>
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

          {selectedDiary ? (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
              {/* AI 일기 내용 */}
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <span>🤖</span>
                    <span>AI 일기</span>
                  </CardTitle>
                  <p className="text-slate-400 text-sm">{formatDate(selectedDiary.created_at)}</p>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="bg-slate-900/50 rounded-lg p-6">
                      <div
                        className="text-slate-200 leading-relaxed prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={createMarkup(selectedDiary.summary)}
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
                  <p className="text-slate-400 text-sm">{parseChatRecords(selectedDiary.content).length}개의 대화</p>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      {parseChatRecords(selectedDiary.content).map((record, index) => (
                        <div key={index} className={`flex ${record.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[80%]">
                            <div
                              className={`px-4 py-3 rounded-lg ${
                                record.role === "user" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-200"
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{record.content}</p>
                            </div>
                            {record.timestamp && <p className="text-xs text-slate-500 mt-1 px-1">{record.timestamp}</p>}
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
    </div>
  )
}
