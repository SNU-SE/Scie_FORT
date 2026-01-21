import type { Survey } from '@/types'

interface SurveyListProps {
  surveys: Survey[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onViewResponses: (id: string) => void
  onDuplicate: (id: string) => void
}

export function SurveyList({
  surveys,
  onEdit,
  onDelete,
  onViewResponses,
  onDuplicate,
}: SurveyListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  if (surveys.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-400">등록된 설문이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-900">
            <th className="py-4 px-4 text-left text-sm font-semibold text-gray-900">
              제목
            </th>
            <th className="py-4 px-4 text-left text-sm font-semibold text-gray-900">
              생성일
            </th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900">
              응답 수
            </th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900">
              상태
            </th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900">
              관리
            </th>
          </tr>
        </thead>
        <tbody>
          {surveys.map((survey) => (
            <tr
              key={survey.id}
              className="border-b border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <td className="py-4 px-4">
                <span className="text-sm text-gray-900 font-medium">
                  {survey.title}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-gray-600">
                  {formatDate(survey.created_at)}
                </span>
              </td>
              <td className="py-4 px-4 text-center">
                <span className="text-sm text-gray-900">
                  -
                </span>
              </td>
              <td className="py-4 px-4 text-center">
                <span
                  className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                    survey.is_active
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {survey.is_active ? '활성' : '비활성'}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(survey.id)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-900 rounded hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    편집
                  </button>
                  <button
                    onClick={() => onViewResponses(survey.id)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-900 rounded hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    응답
                  </button>
                  <button
                    onClick={() => onDuplicate(survey.id)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-400 rounded hover:border-gray-600 hover:text-gray-900 transition-colors"
                  >
                    복제
                  </button>
                  <button
                    onClick={() => onDelete(survey.id)}
                    className="px-3 py-1.5 text-xs font-medium text-error border border-error rounded hover:bg-error hover:text-white transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
