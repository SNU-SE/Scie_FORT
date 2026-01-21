// ============================================
// Survey Platform - Admin Dashboard Page
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Modal, AdminLayout, LoadingSpinner } from '@/components/common'
import { SurveyList } from '@/components/admin'
import { useSurveys, useDeleteSurvey, useCreateSurvey } from '@/hooks'
import type { Survey } from '@/types'

export default function DashboardPage() {
  const navigate = useNavigate()

  // 설문 목록 조회
  const { data: surveys, isLoading, error, refetch } = useSurveys()

  // 설문 삭제 mutation
  const deleteSurveyMutation = useDeleteSurvey()

  // 설문 생성 mutation (복제용)
  const createSurveyMutation = useCreateSurvey()

  // 삭제 확인 모달 상태
  const [deleteTarget, setDeleteTarget] = useState<Survey | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Mounted effect
  useEffect(() => {
    console.log('[DashboardPage] mounted')
  }, [])

  // Log when surveys data is loaded
  useEffect(() => {
    if (surveys) {
      console.log('[DashboardPage] data loaded', { data: surveys })
    }
  }, [surveys])

  // Log error
  useEffect(() => {
    if (error) {
      console.error('[DashboardPage] error', error)
    }
  }, [error])

  // 새 설문 만들기
  const handleCreateNew = () => {
    console.log('[DashboardPage.handleCreateNew] called')
    console.log('[DashboardPage] navigating to', '/admin/survey/new')
    navigate('/admin/survey/new')
  }

  // 설문 편집
  const handleEdit = (survey: Survey) => {
    console.log('[DashboardPage.handleEdit] called', { surveyId: survey.id })
    console.log('[DashboardPage] navigating to', `/admin/survey/${survey.id}`)
    navigate(`/admin/survey/${survey.id}`)
  }

  // 응답 보기
  const handleViewResponses = (survey: Survey) => {
    console.log('[DashboardPage.handleViewResponses] called', { surveyId: survey.id })
    console.log('[DashboardPage] navigating to', `/admin/survey/${survey.id}/responses`)
    navigate(`/admin/survey/${survey.id}/responses`)
  }

  // 설문 복제
  const handleDuplicate = async (survey: Survey) => {
    console.log('[DashboardPage.handleDuplicate] called', { surveyId: survey.id })
    try {
      const duplicatedSurvey = await createSurveyMutation.mutateAsync({
        title: `${survey.title} (복사본)`,
        description: survey.description,
        user_id: survey.user_id,
        is_active: false,
        collect_respondent_info: survey.collect_respondent_info,
        respondent_fields: survey.respondent_fields,
      })
      console.log('[DashboardPage] data loaded', { duplicatedSurvey })

      // 복제된 설문의 편집 페이지로 이동
      console.log('[DashboardPage] navigating to', `/admin/survey/${duplicatedSurvey.id}`)
      navigate(`/admin/survey/${duplicatedSurvey.id}`)
    } catch (err) {
      console.error('[DashboardPage] error', err)
      alert('설문 복제에 실패했습니다.')
    }
  }

  // 삭제 확인 모달 열기
  const handleDeleteClick = (survey: Survey) => {
    console.log('[DashboardPage.handleDeleteClick] called', { surveyId: survey.id })
    setDeleteTarget(survey)
    console.log('[DashboardPage] state changed', { deleteTarget: survey })
  }

  // 삭제 확인 모달 닫기
  const handleDeleteCancel = () => {
    console.log('[DashboardPage.handleDeleteCancel] called')
    setDeleteTarget(null)
    console.log('[DashboardPage] state changed', { deleteTarget: null })
  }

  // 설문 삭제 실행
  const handleDeleteConfirm = async () => {
    console.log('[DashboardPage.handleDeleteConfirm] called', { deleteTargetId: deleteTarget?.id })
    if (!deleteTarget) return

    setIsDeleting(true)
    console.log('[DashboardPage] state changed', { isDeleting: true })
    try {
      await deleteSurveyMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
      console.log('[DashboardPage] state changed', { deleteTarget: null })
      refetch()
    } catch (err) {
      console.error('[DashboardPage] error', err)
      alert('설문 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
      console.log('[DashboardPage] state changed', { isDeleting: false })
    }
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">내 설문 목록</h1>
          <Button onClick={handleCreateNew}>
            + 새 설문 만들기
          </Button>
        </div>

        {/* 설문 목록 */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">설문 목록을 불러오는데 실패했습니다.</p>
            <Button variant="outline" onClick={() => refetch()}>
              다시 시도
            </Button>
          </div>
        ) : surveys && surveys.length > 0 ? (
          <SurveyList
            surveys={surveys}
            onEdit={handleEdit}
            onViewResponses={handleViewResponses}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteClick}
          />
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">아직 생성된 설문이 없습니다.</p>
            <Button onClick={handleCreateNew}>
              첫 설문 만들기
            </Button>
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={handleDeleteCancel}
        title="설문 삭제"
      >
        <div className="p-4">
          <p className="text-gray-700 mb-4">
            <span className="font-semibold">"{deleteTarget?.title}"</span> 설문을 정말 삭제하시겠습니까?
          </p>
          <p className="text-sm text-red-600 mb-6">
            삭제된 설문과 모든 응답 데이터는 복구할 수 없습니다.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
