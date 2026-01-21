import type { ResponseSession } from '@/types'

interface ResponseTableProps {
  sessions: ResponseSession[]
  onViewDetail: (sessionId: string) => void
  onDelete: (sessionId: string) => void
}

export function ResponseTable({
  sessions,
  onViewDetail,
  onDelete,
}: ResponseTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRespondentDisplay = (info: Record<string, string> | null) => {
    if (!info) return '-'

    const displayFields = ['name', 'student_id', 'grade_class']
    const values = displayFields
      .map((key) => info[key])
      .filter(Boolean)

    if (values.length === 0) {
      const firstValue = Object.values(info)[0]
      return firstValue || '-'
    }

    return values.join(' / ')
  }

  if (sessions.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-400">제출된 응답이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-900">
            <th className="py-4 px-4 text-left text-sm font-semibold text-gray-900">
              #
            </th>
            <th className="py-4 px-4 text-left text-sm font-semibold text-gray-900">
              응답자 정보
            </th>
            <th className="py-4 px-4 text-left text-sm font-semibold text-gray-900">
              제출 시간
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
          {sessions.map((session, index) => (
            <tr
              key={session.id}
              className="border-b border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <td className="py-4 px-4">
                <span className="text-sm text-gray-600">{index + 1}</span>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-gray-900">
                  {getRespondentDisplay(session.respondent_info)}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-gray-600">
                  {session.completed_at
                    ? formatDate(session.completed_at)
                    : formatDate(session.started_at)}
                </span>
              </td>
              <td className="py-4 px-4 text-center">
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    session.completed_at
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {session.completed_at ? '완료' : '진행중'}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onViewDetail(session.id)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-900 rounded hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    상세보기
                  </button>
                  <button
                    onClick={() => onDelete(session.id)}
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

      <div className="mt-4 py-3 px-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">
          총 <span className="font-semibold text-gray-900">{sessions.length}</span>개의 응답
          {' / '}
          완료{' '}
          <span className="font-semibold text-gray-900">
            {sessions.filter((s) => s.completed_at).length}
          </span>개
          {' / '}
          진행중{' '}
          <span className="font-semibold text-gray-900">
            {sessions.filter((s) => !s.completed_at).length}
          </span>개
        </p>
      </div>
    </div>
  )
}
