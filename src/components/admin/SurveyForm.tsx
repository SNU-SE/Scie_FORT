import { useState, useEffect } from 'react'
import type { Survey } from '@/types'

interface SurveyFormData {
  title: string
  description: string
  collect_respondent_info: boolean
  is_active: boolean
}

interface SurveyFormProps {
  survey?: Survey
  onSave: (data: SurveyFormData) => void
}

export function SurveyForm({ survey, onSave }: SurveyFormProps) {
  const [formData, setFormData] = useState<SurveyFormData>({
    title: '',
    description: '',
    collect_respondent_info: true,
    is_active: false,
  })

  useEffect(() => {
    if (survey) {
      setFormData({
        title: survey.title,
        description: survey.description ?? '',
        collect_respondent_info: survey.collect_respondent_info,
        is_active: survey.is_active,
      })
    }
  }, [survey])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          설문 제목 <span className="text-error">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors"
          placeholder="설문 제목을 입력하세요"
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          설문 설명
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors resize-none"
          placeholder="설문에 대한 설명을 입력하세요"
        />
      </div>

      <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
        <div>
          <p className="text-sm font-medium text-gray-900">인적정보 수집</p>
          <p className="text-xs text-gray-400 mt-1">
            응답자의 인적정보(학번, 이름 등)를 수집합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              collect_respondent_info: !prev.collect_respondent_info,
            }))
          }
          className={`relative w-12 h-6 rounded-full transition-colors ${
            formData.collect_respondent_info ? 'bg-gray-900' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              formData.collect_respondent_info ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between py-4 border-b border-gray-200">
        <div>
          <p className="text-sm font-medium text-gray-900">설문 활성화</p>
          <p className="text-xs text-gray-400 mt-1">
            활성화된 설문만 응답자가 접근할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              is_active: !prev.is_active,
            }))
          }
          className={`relative w-12 h-6 rounded-full transition-colors ${
            formData.is_active ? 'bg-gray-900' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              formData.is_active ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
        >
          {survey ? '설문 저장' : '설문 생성'}
        </button>
      </div>
    </form>
  )
}
