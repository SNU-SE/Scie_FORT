import { useState } from 'react'

interface AccessCode {
  id: string
  survey_id: string
  code: string
  is_active: boolean
  created_at: string
  expires_at: string | null
}

interface CodeManagerProps {
  codes: AccessCode[]
  onGenerate: () => void
  onToggleActive: (codeId: string) => void
  onDelete: (codeId: string) => void
}

export function CodeManager({
  codes,
  onGenerate,
  onToggleActive,
  onDelete,
}: CodeManagerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(codeId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">접속 코드 관리</h3>
        <button
          onClick={onGenerate}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-600 transition-colors"
        >
          + 새 코드 생성
        </button>
      </div>

      {codes.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-400">생성된 접속 코드가 없습니다.</p>
          <p className="text-xs text-gray-400 mt-1">
            새 코드를 생성하여 응답자에게 공유하세요.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600">
                  접속 코드
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600">
                  생성일
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600">
                  만료일
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">
                  상태
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {codes.map((accessCode) => {
                const expired = isExpired(accessCode.expires_at)
                return (
                  <tr
                    key={accessCode.id}
                    className="border-b border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="px-3 py-1.5 bg-gray-100 text-gray-900 text-sm font-mono rounded">
                          {accessCode.code}
                        </code>
                        <button
                          onClick={() => handleCopy(accessCode.code, accessCode.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
                          title="복사"
                        >
                          {copiedId === accessCode.id ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4 text-green-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(accessCode.created_at)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-sm ${expired ? 'text-error' : 'text-gray-600'}`}
                      >
                        {accessCode.expires_at
                          ? formatDate(accessCode.expires_at)
                          : '없음'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          expired
                            ? 'bg-gray-200 text-gray-600'
                            : accessCode.is_active
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {expired ? '만료' : accessCode.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onToggleActive(accessCode.id)}
                          disabled={expired}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            expired
                              ? 'border border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'border border-gray-400 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                          }`}
                        >
                          {accessCode.is_active ? '비활성화' : '활성화'}
                        </button>
                        <button
                          onClick={() => onDelete(accessCode.id)}
                          className="px-3 py-1 text-xs font-medium text-error border border-error rounded hover:bg-error hover:text-white transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
