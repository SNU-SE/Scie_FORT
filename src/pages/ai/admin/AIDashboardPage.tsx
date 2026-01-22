// ============================================
// AI Survey Platform - AI Dashboard Page
// ============================================

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button, Modal, LoadingSpinner } from '@/components/common'
import { useAISurveys, useDeleteAISurvey, useCreateAISurvey, useAuth } from '@/hooks'
import type { AISurveyRow } from '@/types/ai'

export default function AIDashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // 설문 목록 조회
  const { data: surveys, isLoading, error, refetch } = useAISurveys(user?.id)

  // 설문 삭제 mutation
  const deleteSurveyMutation = useDeleteAISurvey()

  // 설문 생성 mutation (복제용)
  const createSurveyMutation = useCreateAISurvey()

  // 삭제 확인 모달 상태
  const [deleteTarget, setDeleteTarget] = useState<AISurveyRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 새 설문 만들기
  const handleCreateNew = () => {
    navigate('/admin/ai/survey/new')
  }

  // 설문 편집
  const handleEdit = (id: string) => {
    navigate(`/admin/ai/survey/${id}`)
  }

  // 응답 보기
  const handleViewResponses = (id: string) => {
    navigate(`/admin/ai/survey/${id}/responses`)
  }

  // 설문 복제
  const handleDuplicate = async (id: string) => {
    const survey = surveys?.find(s => s.id === id)
    if (!survey || !user) return

    try {
      const duplicatedSurvey = await createSurveyMutation.mutateAsync({
        title: `${survey.title} (복사본)`,
        description: survey.description,
        user_id: user.id,
        system_prompt: survey.system_prompt,
        allow_hint: survey.allow_hint,
        max_hints_per_question: survey.max_hints_per_question,
        is_active: false,
      })

      navigate(`/admin/ai/survey/${duplicatedSurvey.id}`)
    } catch (err) {
      console.error('[AIDashboardPage] error', err)
      alert('설문 복제에 실패했습니다.')
    }
  }

  // 삭제 확인 모달 열기
  const handleDeleteClick = (id: string) => {
    const survey = surveys?.find(s => s.id === id) || null
    setDeleteTarget(survey)
  }

  // 삭제 확인 모달 닫기
  const handleDeleteCancel = () => {
    setDeleteTarget(null)
  }

  // 설문 삭제 실행
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !user) return

    setIsDeleting(true)
    try {
      await deleteSurveyMutation.mutateAsync({ id: deleteTarget.id, userId: user.id })
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      console.error('[AIDashboardPage] error', err)
      alert('설문 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await logout()
    navigate('/admin/ai')
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/admin/ai/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">AI Survey Admin</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/admin/ai/dashboard"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-900"
              >
                AI 설문관리
              </Link>
              <Link
                to="/admin/dashboard"
                className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                일반 설문관리
              </Link>
            </nav>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AI 챗봇 설문 목록</h1>
          <Button onClick={handleCreateNew}>
            + 새 AI 설문 만들기
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
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {surveys.map((survey) => (
                  <tr key={survey.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {survey.title}
                          </div>
                          {survey.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {survey.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          survey.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {survey.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(survey.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(survey.id)}
                        >
                          편집
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewResponses(survey.id)}
                        >
                          응답
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(survey.id)}
                        >
                          복제
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(survey.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">아직 생성된 AI 설문이 없습니다.</p>
            <Button onClick={handleCreateNew}>
              첫 AI 설문 만들기
            </Button>
          </div>
        )}
      </main>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={handleDeleteCancel}
        title="AI 설문 삭제"
      >
        <div className="p-4">
          <p className="text-gray-700 mb-4">
            <span className="font-semibold">"{deleteTarget?.title}"</span> 설문을 정말 삭제하시겠습니까?
          </p>
          <p className="text-sm text-red-600 mb-6">
            삭제된 설문과 모든 대화 데이터는 복구할 수 없습니다.
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
    </div>
  )
}
