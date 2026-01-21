import type { Question, Option, ResponseSession, Response } from '@/types'

interface ResponseDetailProps {
  session: ResponseSession
  responses: Response[]
  questions: Question[]
  options: Option[]
  onClose?: () => void
}

export function ResponseDetail({
  session,
  responses,
  questions,
  options,
  onClose,
}: ResponseDetailProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'single':
        return '단일 선택'
      case 'multiple':
        return '다중 선택'
      case 'text':
        return '서술형'
      default:
        return type
    }
  }

  const getResponseForQuestion = (questionId: string) => {
    return responses.filter((r) => r.question_id === questionId)
  }

  const getOptionText = (optionId: string) => {
    const option = options.find((o) => o.id === optionId)
    return option?.content ?? '-'
  }

  const renderResponse = (question: Question) => {
    const questionResponses = getResponseForQuestion(question.id)

    if (questionResponses.length === 0) {
      return <span className="text-gray-400 italic">응답 없음</span>
    }

    if (question.type === 'text') {
      const textResponse = questionResponses[0]?.text_response
      return (
        <p className="text-gray-900 whitespace-pre-wrap">
          {textResponse || <span className="text-gray-400 italic">빈 응답</span>}
        </p>
      )
    }

    // Single or Multiple choice
    return (
      <ul className="space-y-1">
        {questionResponses.map((response) => (
          <li key={response.id} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
            <span className="text-gray-900">
              {response.selected_option_ids && response.selected_option_ids.length > 0
                ? response.selected_option_ids.map(getOptionText).join(', ')
                : '-'}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  const sortedQuestions = [...questions]
    .sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">응답 상세</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Respondent Info */}
          {session.respondent_info && Object.keys(session.respondent_info).length > 0 && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">응답자 정보</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(session.respondent_info).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-xs text-gray-400">{key}</span>
                    <p className="text-sm text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Info */}
          <div className="mb-6 text-sm text-gray-600">
            <p>시작: {formatDate(session.started_at)}</p>
            {session.completed_at && (
              <p>완료: {formatDate(session.completed_at)}</p>
            )}
          </div>

          {/* Responses */}
          <div className="space-y-6">
            {sortedQuestions.map((question) => (
              <div
                key={question.id}
                className={`p-4 border rounded-lg ${
                  question.parent_question_id
                    ? 'ml-4 border-gray-200 bg-gray-100'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium text-white bg-gray-900 rounded">
                    {question.order_index}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">
                        {getQuestionTypeLabel(question.type)}
                      </span>
                      {question.is_required && (
                        <span className="text-xs text-error">필수</span>
                      )}
                      {question.parent_question_id && (
                        <span className="text-xs text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded">
                          조건부
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {question.content}
                    </p>
                  </div>
                </div>

                <div className="pl-9">
                  {renderResponse(question)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
