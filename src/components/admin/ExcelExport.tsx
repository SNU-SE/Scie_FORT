import { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import type { Question, Option } from '@/types'

interface ExcelExportProps {
  surveyId: string
  surveyTitle: string
}

interface ResponseSession {
  id: string
  respondent_info: Record<string, string> | null
  started_at: string
  completed_at: string | null
}

interface Response {
  id: string
  session_id: string
  question_id: string
  option_id: string | null
  text_response: string | null
}

export function ExcelExport({ surveyId, surveyTitle }: ExcelExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Fetch all data
      const [questionsRes, sessionsRes] = await Promise.all([
        supabase
          .from('questions')
          .select('*')
          .eq('survey_id', surveyId)
          .eq('is_page_break', false)
          .order('order_index'),
        supabase
          .from('response_sessions')
          .select('*')
          .eq('survey_id', surveyId)
          .not('completed_at', 'is', null)
          .order('completed_at'),
      ])

      const questions: Question[] = questionsRes.data ?? []
      const sessions: ResponseSession[] = sessionsRes.data ?? []

      // Get options for all questions
      const questionIds = questions.map((q) => q.id)
      const optionsForQuestionsRes = await supabase
        .from('options')
        .select('*')
        .in('question_id', questionIds)
      const options: Option[] = optionsForQuestionsRes.data ?? []

      // Filter responses for completed sessions
      const sessionIds = sessions.map((s) => s.id)
      const filteredResponsesRes = await supabase
        .from('responses')
        .select('*')
        .in('session_id', sessionIds)
      const responses: Response[] = filteredResponsesRes.data ?? []

      // Get respondent info keys
      const respondentInfoKeys = new Set<string>()
      sessions.forEach((session) => {
        if (session.respondent_info) {
          Object.keys(session.respondent_info).forEach((key) => {
            respondentInfoKeys.add(key)
          })
        }
      })
      const infoKeys = Array.from(respondentInfoKeys)

      // Build headers
      const headers = [
        '#',
        ...infoKeys,
        '제출 시간',
        ...questions.map((q) => q.content),
      ]

      // Build rows
      const rows = sessions.map((session, index) => {
        const row: (string | number)[] = [index + 1]

        // Add respondent info
        infoKeys.forEach((key) => {
          row.push(session.respondent_info?.[key] ?? '')
        })

        // Add submission time
        row.push(
          session.completed_at
            ? new Date(session.completed_at).toLocaleString('ko-KR')
            : ''
        )

        // Add responses
        questions.forEach((question) => {
          const questionResponses = responses.filter(
            (r) => r.session_id === session.id && r.question_id === question.id
          )

          if (question.type === 'text') {
            row.push(questionResponses[0]?.text_response ?? '')
          } else {
            const selectedOptions = questionResponses
              .map((r) => {
                const option = options.find((o) => o.id === r.option_id)
                return option?.content ?? ''
              })
              .filter(Boolean)
            row.push(selectedOptions.join(', '))
          }
        })

        return row
      })

      // Create workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

      // Set column widths
      const colWidths = headers.map((header, i) => {
        if (i === 0) return { wch: 5 }
        if (typeof header === 'string' && header.length > 30) return { wch: 40 }
        return { wch: 20 }
      })
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, '응답 데이터')

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `${surveyTitle}_응답_${timestamp}.xlsx`

      // Download
      XLSX.writeFile(wb, filename)
    } catch (error) {
      console.error('Export failed:', error)
      alert('엑셀 내보내기에 실패했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isExporting
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-gray-900 text-white hover:bg-gray-600'
      }`}
    >
      {isExporting ? (
        <>
          <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          내보내는 중...
        </>
      ) : (
        <>
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Excel 다운로드
        </>
      )}
    </button>
  )
}
