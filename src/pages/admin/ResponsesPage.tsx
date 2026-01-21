// ============================================
// Survey Platform - Admin Responses Page
// ============================================

import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, Modal, AdminLayout, LoadingSpinner } from '@/components/common'
import { ResponseTable, ResponseDetail, ExcelExport } from '@/components/admin'
import { useSurveyDetail, useResponsesBySurvey, useRealtimeResponses } from '@/hooks'
import type { ResponseSession } from '@/types'

export default function ResponsesPage() {
  const { id: surveyId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // 설문 정보 조회
  const { data: survey, isLoading: isSurveyLoading } = useSurveyDetail(surveyId)

  // 응답 목록 조회
  const {
    data: responses,
    isLoading: isResponsesLoading,
    error: responsesError,
    refetch: refetchResponses,
  } = useResponsesBySurvey(surveyId)

  // 실시간 응답 업데이트
  useRealtimeResponses(surveyId, {
    onInsert: () => {
      console.log('[ResponsesPage] realtime insert received')
      refetchResponses()
    },
    onUpdate: () => {
      console.log('[ResponsesPage] realtime update received')
      refetchResponses()
    },
  })

  // 상세 보기 모달 상태
  const [selectedResponse, setSelectedResponse] = useState<ResponseSession | null>(null)

  // Mounted effect
  useEffect(() => {
    console.log('[ResponsesPage] mounted')
  }, [])

  // Log when survey data is loaded
  useEffect(() => {
    if (survey) {
      console.log('[ResponsesPage] data loaded', { survey })
    }
  }, [survey])

  // Log when responses data is loaded
  useEffect(() => {
    if (responses) {
      console.log('[ResponsesPage] data loaded', { responses })
    }
  }, [responses])

  // Log error
  useEffect(() => {
    if (responsesError) {
      console.error('[ResponsesPage] error', responsesError)
    }
  }, [responsesError])

  // 통계 계산
  const stats = useMemo(() => {
    if (!responses || responses.length === 0) {
      return {
        totalResponses: 0,
        completedResponses: 0,
        completionRate: 0,
        averageResponseTime: null,
      }
    }

    const total = responses.length
    const completed = responses.filter((r) => r.completed_at !== null).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // 평균 응답 시간 계산 (완료된 응답만)
    const completedWithTime = responses.filter(
      (r) => r.completed_at && r.started_at
    )

    let averageResponseTime: number | null = null
    if (completedWithTime.length > 0) {
      const totalTime = completedWithTime.reduce((sum, r) => {
        const start = new Date(r.started_at).getTime()
        const end = new Date(r.completed_at!).getTime()
        return sum + (end - start)
      }, 0)
      averageResponseTime = Math.round(totalTime / completedWithTime.length / 1000) // 초 단위
    }

    return {
      totalResponses: total,
      completedResponses: completed,
      completionRate,
      averageResponseTime,
    }
  }, [responses])

  // 응답 시간 포맷
  const formatResponseTime = (seconds: number | null) => {
    if (seconds === null) return '-'
    if (seconds < 60) return `${seconds}초`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}분 ${remainingSeconds}초`
  }

  // 상세 보기 열기
  const handleViewDetail = (response: ResponseSession) => {
    console.log('[ResponsesPage.handleViewDetail] called', { responseId: response.id })
    setSelectedResponse(response)
    console.log('[ResponsesPage] state changed', { selectedResponse: response })
  }

  // 상세 보기 닫기
  const handleCloseDetail = () => {
    console.log('[ResponsesPage.handleCloseDetail] called')
    setSelectedResponse(null)
    console.log('[ResponsesPage] state changed', { selectedResponse: null })
  }

  // 설문 편집 페이지로 이동
  const handleGoToEdit = () => {
    console.log('[ResponsesPage.handleGoToEdit] called')
    console.log('[ResponsesPage] navigating to', `/admin/survey/${surveyId}`)
    navigate(`/admin/survey/${surveyId}`)
  }

  // 로딩 중
  if (isSurveyLoading || isResponsesLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    )
  }

  // 에러 발생
  if (responsesError) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">응답 데이터를 불러오는데 실패했습니다.</p>
            <Button variant="outline" onClick={() => refetchResponses()}>
              다시 시도
            </Button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // 설문을 찾을 수 없음
  if (!survey) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center py-20">
            <p className="text-gray-600 mb-4">설문을 찾을 수 없습니다.</p>
            <Button onClick={() => {
              console.log('[ResponsesPage] navigating to', '/admin/dashboard')
              navigate('/admin/dashboard')
            }}>
              대시보드로 이동
            </Button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
            <p className="text-sm text-gray-500 mt-1">응답 관리</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGoToEdit}>
              설문 편집
            </Button>
            <ExcelExport
              surveyId={surveyId!}
              surveyTitle={survey.title}
              responses={responses || []}
              questions={survey.questions || []}
            />
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-gray-500 mb-1">총 응답 수</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalResponses}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500 mb-1">완료된 응답</p>
            <p className="text-2xl font-bold text-green-600">{stats.completedResponses}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500 mb-1">완료율</p>
            <p className="text-2xl font-bold text-blue-600">{stats.completionRate}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500 mb-1">평균 응답 시간</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatResponseTime(stats.averageResponseTime)}
            </p>
          </Card>
        </div>

        {/* 응답 목록 */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">응답 목록</h2>
            <Button variant="outline" size="sm" onClick={() => {
              console.log('[ResponsesPage.handleRefresh] called')
              refetchResponses()
            }}>
              새로고침
            </Button>
          </div>

          {responses && responses.length > 0 ? (
            <ResponseTable
              responses={responses}
              respondentFields={survey.respondent_fields || []}
              onViewDetail={handleViewDetail}
            />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">아직 응답이 없습니다.</p>
            </div>
          )}
        </Card>
      </div>

      {/* 응답 상세 모달 */}
      <Modal
        isOpen={!!selectedResponse}
        onClose={handleCloseDetail}
        title="응답 상세"
        size="lg"
      >
        {selectedResponse && (
          <ResponseDetail
            response={selectedResponse}
            questions={survey.questions || []}
            respondentFields={survey.respondent_fields || []}
            onClose={handleCloseDetail}
          />
        )}
      </Modal>
    </AdminLayout>
  )
}
