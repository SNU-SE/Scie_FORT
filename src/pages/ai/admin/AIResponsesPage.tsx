// ============================================
// AI Survey Platform - AI Responses Page
// ============================================

import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Button, LoadingSpinner, Modal, Card } from '@/components/common'
import {
  useAISurveyDetail,
  useAISessions,
  useAISession,
  useAuth,
} from '@/hooks'
import { AIExcelExport } from '@/components/ai/admin/AIExcelExport'

export default function AIResponsesPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { logout } = useAuth()

  // Queries
  const { data: survey, isLoading: surveyLoading, error: surveyError } = useAISurveyDetail(id)
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError, refetch } = useAISessions(id)

  // Session detail modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const { data: sessionDetail, isLoading: sessionDetailLoading } = useAISession(selectedSessionId || undefined)

  const handleLogout = async () => {
    await logout()
    navigate('/admin')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">완료</span>
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">진행중</span>
      case 'abandoned':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">중단</span>
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">{status}</span>
    }
  }

  if (surveyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (surveyError || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">설문을 불러오는데 실패했습니다.</p>
          <Button onClick={() => navigate('/admin/ai')}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/ai" className="text-gray-500 hover:text-gray-700">
              &larr; 목록
            </Link>
            <span className="text-xl font-bold text-gray-900">
              {survey.title} - 응답 조회
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-500">총 응답</p>
              <p className="text-2xl font-bold text-gray-900">{sessions?.length || 0}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-500">완료</p>
              <p className="text-2xl font-bold text-green-600">
                {sessions?.filter(s => s.status === 'completed').length || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-500">진행중</p>
              <p className="text-2xl font-bold text-yellow-600">
                {sessions?.filter(s => s.status === 'in_progress').length || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-500">문제 수</p>
              <p className="text-2xl font-bold text-blue-600">{survey.questions?.length || 0}</p>
            </div>
          </Card>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">응답 목록</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              새로고침
            </Button>
            {sessions && sessions.length > 0 && (
              <AIExcelExport surveyId={id!} surveyTitle={survey.title} />
            )}
          </div>
        </div>

        {/* 응답 목록 테이블 */}
        {sessionsLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : sessionsError ? (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">응답 목록을 불러오는데 실패했습니다.</p>
            <Button variant="outline" onClick={() => refetch()}>
              다시 시도
            </Button>
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학생 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    진행률
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시작 시간
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.student_name || '이름 없음'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.student_id || 'ID 없음'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(session.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">
                          {session.current_question_index + 1} / {survey.questions?.length || 0}
                        </span>
                        <div className="ml-2 w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                survey.questions?.length
                                  ? ((session.current_question_index + 1) / survey.questions.length) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(session.started_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        대화 보기
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <p className="text-gray-500">아직 응답이 없습니다.</p>
          </div>
        )}
      </main>

      {/* Session Detail Modal */}
      <Modal
        isOpen={!!selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
        title="대화 내용"
      >
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {sessionDetailLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : sessionDetail?.messages && sessionDetail.messages.length > 0 ? (
            <div className="space-y-3">
              {sessionDetail.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.content_type === 'image' ? (
                      <img
                        src={message.content}
                        alt="문제 이미지"
                        className="max-w-full rounded"
                      />
                    ) : message.content_type === 'options' ? (
                      <div className="text-sm">
                        <p className="mb-2">{message.content}</p>
                        <p className="text-xs opacity-75">[선택지 표시됨]</p>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    <div
                      className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}
                    >
                      {message.message_type && (
                        <span className="mr-2">[{message.message_type}]</span>
                      )}
                      {new Date(message.created_at).toLocaleTimeString('ko-KR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              대화 내용이 없습니다.
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
