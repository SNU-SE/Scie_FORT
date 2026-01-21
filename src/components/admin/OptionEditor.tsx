import { useState, useRef } from 'react'
import type { Option } from '@/types'

interface OptionEditorProps {
  options: Option[]
  onChange: (options: Option[]) => void
  onAddCondition: (optionId: string) => void
}

export function OptionEditor({
  options,
  onChange,
  onAddCondition,
}: OptionEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragCounter = useRef(0)

  const handleAddOption = () => {
    const newOption: Option = {
      id: crypto.randomUUID(),
      question_id: options[0]?.question_id ?? '',
      content: '',
      order_index: options.length + 1,
      created_at: new Date().toISOString(),
    }
    onChange([...options, newOption])
  }

  const handleDeleteOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index).map((opt, i) => ({
      ...opt,
      order_index: i + 1,
    }))
    onChange(updated)
  }

  const handleOptionChange = (index: number, text: string) => {
    const updated = options.map((opt, i) =>
      i === index ? { ...opt, content: text } : opt
    )
    onChange(updated)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
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

    const reordered = [...options]
    const [removed] = reordered.splice(draggedIndex, 1)
    reordered.splice(dropIndex, 0, removed)

    const updatedOptions = reordered.map((opt, i) => ({
      ...opt,
      order_index: i + 1,
    }))

    onChange(updatedOptions)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
    dragCounter.current = 0
  }

  return (
    <div className="space-y-2">
      {options.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-400">선택지가 없습니다.</p>
        </div>
      ) : (
        options.map((option, index) => (
          <div
            key={option.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              flex items-center gap-3 p-3 border rounded-lg transition-all
              ${draggedIndex === index ? 'opacity-50' : ''}
              ${dragOverIndex === index ? 'border-gray-900 bg-gray-100' : 'border-gray-200'}
            `}
          >
            <div className="text-gray-400 cursor-grab active:cursor-grabbing">
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
                  d="M4 8h16M4 16h16"
                />
              </svg>
            </div>

            <span className="text-xs font-medium text-gray-400 w-6 text-center">
              {option.order_index}
            </span>

            <input
              type="text"
              value={option.content}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-900 transition-colors"
              placeholder="선택지 내용을 입력하세요"
            />

            <button
              type="button"
              onClick={() => onAddCondition(option.id)}
              className="px-2 py-1 text-xs text-gray-600 border border-gray-400 rounded hover:border-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
              title="이 선택지 선택 시 표시할 조건부 질문 추가"
            >
              조건 추가
            </button>

            <button
              type="button"
              onClick={() => handleDeleteOption(index)}
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
        ))
      )}

      <button
        type="button"
        onClick={handleAddOption}
        className="w-full py-3 border border-dashed border-gray-400 text-gray-600 text-sm font-medium rounded-lg hover:border-gray-900 hover:text-gray-900 transition-colors"
      >
        + 선택지 추가
      </button>
    </div>
  )
}
