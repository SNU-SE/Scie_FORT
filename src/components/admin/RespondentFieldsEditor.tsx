import { useState } from 'react'
import type { RespondentField } from '@/types'

interface RespondentFieldsEditorProps {
  fields: RespondentField[]
  onChange: (fields: RespondentField[]) => void
}

const PRESET_FIELDS: RespondentField[] = [
  { key: 'student_id', label: '학번', required: true },
  { key: 'name', label: '이름', required: true },
  { key: 'grade_class', label: '학년/반', required: false },
]

export function RespondentFieldsEditor({
  fields,
  onChange,
}: RespondentFieldsEditorProps) {
  const [showPresets, setShowPresets] = useState(false)

  const handleAddField = () => {
    const newField: RespondentField = {
      key: `field_${Date.now()}`,
      label: '',
      required: false,
    }
    onChange([...fields, newField])
  }

  const handleDeleteField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleFieldChange = (
    index: number,
    key: keyof RespondentField,
    value: string | boolean
  ) => {
    const updated = fields.map((field, i) =>
      i === index ? { ...field, [key]: value } : field
    )
    onChange(updated)
  }

  const handleApplyPreset = () => {
    onChange(PRESET_FIELDS)
    setShowPresets(false)
  }

  const handleKeyChange = (index: number, newKey: string) => {
    const sanitizedKey = newKey
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
    handleFieldChange(index, 'key', sanitizedKey)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">인적정보 필드 설정</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-400 rounded hover:border-gray-600 hover:text-gray-900 transition-colors"
          >
            프리셋
          </button>
          <button
            type="button"
            onClick={handleAddField}
            className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-900 rounded hover:bg-gray-900 hover:text-white transition-colors"
          >
            + 필드 추가
          </button>
        </div>
      </div>

      {showPresets && (
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600 mb-3">
            기본 프리셋을 적용하면 기존 필드가 모두 대체됩니다.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_FIELDS.map((field) => (
              <span
                key={field.key}
                className="px-2 py-1 text-xs bg-white border border-gray-200 rounded"
              >
                {field.label} {field.required && '*'}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleApplyPreset}
            className="px-4 py-2 text-xs font-medium bg-gray-900 text-white rounded hover:bg-gray-600 transition-colors"
          >
            프리셋 적용
          </button>
        </div>
      )}

      {fields.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-400">등록된 필드가 없습니다.</p>
          <p className="text-xs text-gray-400 mt-1">
            필드를 추가하거나 프리셋을 적용하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={`${field.key}-${index}`}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">
                  필드 키 (영문)
                </label>
                <input
                  type="text"
                  value={field.key}
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="field_key"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">
                  라벨 (표시명)
                </label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) =>
                    handleFieldChange(index, 'label', e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="표시될 이름"
                />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      handleFieldChange(index, 'required', e.target.checked)
                    }
                    className="w-4 h-4 accent-gray-900"
                  />
                  <span className="text-xs text-gray-600">필수</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleDeleteField(index)}
                  className="p-2 text-gray-400 hover:text-error transition-colors"
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
          ))}
        </div>
      )}
    </div>
  )
}
