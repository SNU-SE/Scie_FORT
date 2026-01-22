// ============================================
// AI Survey Platform - AI Excel Export Component
// ============================================

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import type { AIQuestion, AIChatSessionRow, AIChatMessageRow, AIOptionRow } from '@/types/ai'

interface AIExcelExportProps {
  surveyId: string
  surveyTitle: string
}

export function AIExcelExport({ surveyId, surveyTitle }: AIExcelExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Fetch all data in parallel
      const [questionsRes, sessionsRes, optionsRes] = await Promise.all([
        supabase
          .from('ai_questions')
          .select('*')
          .eq('survey_id', surveyId)
          .order('order_index'),
        supabase
          .from('ai_chat_sessions')
          .select('*')
          .eq('survey_id', surveyId)
          .order('started_at'),
        supabase
          .from('ai_options')
          .select('*')
          .in('question_id', (await supabase.from('ai_questions').select('id').eq('survey_id', surveyId)).data?.map(q => q.id) || [])
      ])

      const questions: AIQuestion[] = (questionsRes.data ?? []).map(q => ({
        ...q,
        options: []
      }))
      const sessions: AIChatSessionRow[] = sessionsRes.data ?? []
      const options: AIOptionRow[] = optionsRes.data ?? []

      // Assign options to questions
      questions.forEach(q => {
        q.options = options.filter(o => o.question_id === q.id).sort((a, b) => a.order_index - b.order_index)
      })

      if (sessions.length === 0) {
        alert('내보낼 응답이 없습니다.')
        setIsExporting(false)
        return
      }

      // Fetch all messages for these sessions
      const sessionIds = sessions.map(s => s.id)
      const messagesRes = await supabase
        .from('ai_chat_messages')
        .select('*')
        .in('session_id', sessionIds)
        .order('message_index')

      const messages: AIChatMessageRow[] = messagesRes.data ?? []

      // Build export data - one row per message
      const headers = [
        '학생ID',
        '학생이름',
        '문제번호',
        '역할',
        '메시지유형',
        '내용',
        '선택옵션',
        '시간',
      ]

      const rows: (string | number)[][] = []

      sessions.forEach(session => {
        const sessionMessages = messages.filter(m => m.session_id === session.id)

        sessionMessages.forEach(msg => {
          // Find question number
          const question = questions.find(q => q.id === msg.question_id)
          const questionNumber = question
            ? questions.indexOf(question) + 1
            : '-'

          // Find selected option text
          let selectedOptionText = ''
          if (msg.selected_option_id) {
            const option = options.find(o => o.id === msg.selected_option_id)
            if (option) {
              const optionIndex = question?.options.findIndex(o => o.id === option.id) ?? -1
              selectedOptionText = optionIndex >= 0
                ? `${String.fromCharCode(65 + optionIndex)}. ${option.option_text}`
                : option.option_text
            }
          }

          rows.push([
            session.student_id || '',
            session.student_name || '',
            questionNumber,
            msg.role === 'user' ? '학생' : msg.role === 'assistant' ? 'AI' : '시스템',
            msg.message_type || '',
            msg.content_type === 'image'
              ? `[이미지: ${msg.content}]`
              : msg.content_type === 'options'
              ? '[선택지 표시]'
              : msg.content,
            selectedOptionText,
            new Date(msg.created_at).toLocaleString('ko-KR'),
          ])
        })
      })

      // Create workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

      // Set column widths
      ws['!cols'] = [
        { wch: 15 },  // 학생ID
        { wch: 12 },  // 학생이름
        { wch: 10 },  // 문제번호
        { wch: 8 },   // 역할
        { wch: 12 },  // 메시지유형
        { wch: 60 },  // 내용
        { wch: 25 },  // 선택옵션
        { wch: 18 },  // 시간
      ]

      XLSX.utils.book_append_sheet(wb, ws, '대화 내역')

      // Add summary sheet
      const summaryHeaders = [
        '학생ID',
        '학생이름',
        '상태',
        '완료한 문제 수',
        '총 메시지 수',
        '힌트 사용 횟수',
        '시작 시간',
        '완료 시간',
      ]

      const summaryRows = sessions.map(session => {
        const sessionMessages = messages.filter(m => m.session_id === session.id)
        const hintCount = sessionMessages.filter(m => m.message_type === 'hint').length

        return [
          session.student_id || '',
          session.student_name || '',
          session.status === 'completed' ? '완료' : session.status === 'in_progress' ? '진행중' : '중단',
          session.current_question_index + 1,
          sessionMessages.length,
          hintCount,
          new Date(session.started_at).toLocaleString('ko-KR'),
          session.completed_at
            ? new Date(session.completed_at).toLocaleString('ko-KR')
            : '-',
        ]
      })

      const summaryWs = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows])
      summaryWs['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 18 },
      ]

      XLSX.utils.book_append_sheet(wb, summaryWs, '요약')

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `${surveyTitle}_AI응답_${timestamp}.xlsx`

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
