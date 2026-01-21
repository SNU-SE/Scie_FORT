import { useState, useRef } from 'react'
import type { Question } from '@/types'

interface QuestionListProps {
  questions: Question[]
  onReorder: (questions: Question[]) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onAddPageBreak: (afterIndex: number) => void
}

export function QuestionList({
  questions,
  onReorder,
  onEdit,
  onDelete,
  onAddPageBreak,
}: QuestionListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragCounter = useRef(0)

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragCounter.current++
    if (draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragOverIndex(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    dragCounter.current = 0

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const reordered = [...questions]
    const [removed] = reordered.splice(draggedIndex, 1)
    reordered.splice(dropIndex, 0, removed)

    // Update order_num for all questions
    const updatedQuestions = reordered.map((q, i) => ({
      ...q,
      order_num: i + 1,
    }))

    onReorder(updatedQuestions)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
    dragCounter.current = 0
  }

  if (questions.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-400">등록된 문항이 없습니다.</p>
        <p className="text-xs text-gray-400 mt-1">
          문항 추가 버튼을 눌러 새 문항을 만드세요.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {questions.map((question, index) => {
        const isConditional = !!question.parent_question_id
        const isPageBreak = question.is_page_break

        if (isPageBreak) {
          return (
            <div
              key={question.id}
              className="flex items-center gap-4 py-3"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex-1 border-t border-dashed border-gray-400" />
              <span className="text-xs text-gray-400 px-4">페이지 나눔</span>
              <div className="flex-1 border-t border-dashed border-gray-400" />
              <button
                onClick={() => onDelete(question.id)}
                className="p-1 text-gray-400 hover:text-error transition-colors"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )
        }

        return (
          <div
            key={question.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              flex items-center gap-4 p-4 border rounded-lg transition-all cursor-move
              ${isConditional ? 'ml-8 border-gray-200 bg-gray-100' : 'border-gray-200'}
              ${draggedIndex === index ? 'opacity-50' : ''}
              ${dragOverIndex === index ? 'border-gray-900 bg-gray-100' : ''}
              hover:border-gray-400
            `}
          >
            <div className="text-gray-400 cursor-grab active:cursor-grabbing">
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
                  d="M4 8h16M4 16h16"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-900 bg-gray-200 px-2 py-0.5 rounded">
                  {question.order_num}
                </span>
                <span className="text-xs text-gray-400">
                  {getQuestionTypeLabel(question.question_type)}
                </span>
                {question.required && (
                  <span className="text-xs text-error">필수</span>
                )}
                {isConditional && (
                  <span className="text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                    조건부
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-900 truncate">
                {question.question_text}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(question.id)}
                className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                title="편집"
              >
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => onAddPageBreak(index)}
                className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                title="페이지 나눔 추가"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
              <button
                onClick={() => onDelete(question.id)}
                className="p-2 text-gray-400 hover:text-error transition-colors"
                title="삭제"
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
