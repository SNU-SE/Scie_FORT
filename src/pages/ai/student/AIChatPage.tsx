// ============================================
// AI Survey Platform - AI Chat Page
// ============================================

import { useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingSpinner } from '@/components/common'
import {
  useAISurveyByCode,
  useUpdateAISession,
  saveAIMessage,
} from '@/hooks/useAI'
import { useChatStore, generateQuestionIntroMessages } from '@/stores/chatStore'
import { ChatInterface } from '@/components/ai/ChatInterface'
import type { ChatMessage, AIOption } from '@/types/ai'

export default function AIChatPage() {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()

  const {
    survey,
    session,
    questions,
    messages,
    currentQuestionIndex,
    hintsUsed,
    isStreaming,
    streamingContent,
    error: storeError,
    setSurvey,
    setQuestions,
    addMessage,
    updateLastMessage,
    setMessages,
    setCurrentQuestionIndex,
    incrementHintUsed,
    getHintsUsed,
    setIsStreaming,
    setStreamingContent,
    appendStreamingContent,
  } = useChatStore()

  const updateSessionMutation = useUpdateAISession()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch survey if not in store
  const { data: surveyData, isLoading: surveyLoading, error: surveyError } = useAISurveyByCode(
    !survey ? code : undefined
  )

  // Restore session if page is refreshed
  useEffect(() => {
    if (surveyData && !survey) {
      setSurvey(surveyData)
      setQuestions(surveyData.questions || [])
    }
  }, [surveyData, survey, setSurvey, setQuestions])

  // Initialize first question messages
  useEffect(() => {
    if (
      questions.length > 0 &&
      messages.length === 0 &&
      session
    ) {
      const firstQuestion = questions[0]
      const introMessages = generateQuestionIntroMessages(firstQuestion, 0)
      setMessages(introMessages)

      // Save intro messages to DB
      introMessages.forEach(async (msg) => {
        await saveAIMessage(session.id, {
          question_id: firstQuestion.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          content_type: msg.content_type,
          message_type: 'system',
        })
      })
    }
  }, [questions, messages.length, session, setMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Get current question
  const currentQuestion = questions[currentQuestionIndex] || null

  // Check if on last question
  const isLastQuestion = currentQuestionIndex >= questions.length - 1

  // Handle sending a message
  const handleSendMessage = useCallback(async (
    content: string,
    messageType: 'answer' | 'hint_request',
    selectedOptionId?: string
  ) => {
    if (!session || !currentQuestion || isStreaming) return

    // Add user message to UI
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      content_type: 'text',
      message_type: messageType === 'hint_request' ? 'hint_request' : 'answer',
      selected_option_id: selectedOptionId,
      created_at: new Date().toISOString(),
    }
    addMessage(userMessage)

    // Save user message to DB
    await saveAIMessage(session.id, {
      question_id: currentQuestion.id,
      role: 'user',
      content,
      content_type: 'text',
      message_type: messageType === 'hint_request' ? 'hint_request' : 'answer',
      selected_option_id: selectedOptionId,
    })

    // Start streaming
    setIsStreaming(true)
    setStreamingContent('')

    // Add placeholder for AI response
    const aiPlaceholder: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: '',
      content_type: 'text',
      message_type: messageType === 'hint_request' ? 'hint' : 'evaluation',
      isStreaming: true,
      created_at: new Date().toISOString(),
    }
    addMessage(aiPlaceholder)

    try {
      // Get Supabase URL for Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          sessionId: session.id,
          questionId: currentQuestion.id,
          userMessage: content,
          messageType,
          selectedOptionId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

          for (const line of lines) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'content') {
                fullContent += parsed.content
                appendStreamingContent(parsed.content)
              } else if (parsed.type === 'done') {
                // Update hint count if hint was requested
                if (messageType === 'hint_request') {
                  incrementHintUsed(currentQuestion.id)
                }
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      // Update the last message with full content
      updateLastMessage(fullContent)
    } catch (err) {
      console.error('Chat error:', err)
      updateLastMessage('죄송해요, 오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
    }
  }, [
    session,
    currentQuestion,
    isStreaming,
    addMessage,
    setIsStreaming,
    setStreamingContent,
    appendStreamingContent,
    updateLastMessage,
    incrementHintUsed,
  ])

  // Handle option selection
  const handleOptionSelect = useCallback((option: AIOption) => {
    const content = `${option.option_text}을(를) 선택했어요.`
    handleSendMessage(content, 'answer', option.id)
  }, [handleSendMessage])

  // Handle hint request
  const handleHintRequest = useCallback(() => {
    if (!survey || !currentQuestion) return

    const usedCount = getHintsUsed(currentQuestion.id)
    const maxHints = survey.max_hints_per_question || 3

    if (!survey.allow_hint) {
      addMessage({
        id: `system-${Date.now()}`,
        role: 'assistant',
        content: '힌트 기능이 비활성화되어 있어요.',
        content_type: 'text',
        message_type: 'system',
        created_at: new Date().toISOString(),
      })
      return
    }

    if (usedCount >= maxHints) {
      addMessage({
        id: `system-${Date.now()}`,
        role: 'assistant',
        content: `이 문제에서는 힌트를 ${maxHints}번까지만 사용할 수 있어요. 이미 다 사용했어요!`,
        content_type: 'text',
        message_type: 'system',
        created_at: new Date().toISOString(),
      })
      return
    }

    handleSendMessage('힌트를 주세요!', 'hint_request')
  }, [survey, currentQuestion, getHintsUsed, addMessage, handleSendMessage])

  // Handle moving to next question
  const handleNextQuestion = useCallback(async () => {
    if (!session || isLastQuestion) return

    const nextIndex = currentQuestionIndex + 1

    // Update session in DB
    await updateSessionMutation.mutateAsync({
      id: session.id,
      data: {
        current_question_index: nextIndex,
        hints_used: hintsUsed,
      },
      surveyId: session.survey_id,
    })

    // Generate intro messages for next question
    const nextQ = questions[nextIndex]
    const introMessages = generateQuestionIntroMessages(nextQ, nextIndex)

    // Add to UI
    introMessages.forEach(msg => addMessage(msg))

    // Save to DB
    for (const msg of introMessages) {
      await saveAIMessage(session.id, {
        question_id: nextQ.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        content_type: msg.content_type,
        message_type: 'system',
      })
    }

    // Update store
    setCurrentQuestionIndex(nextIndex)
  }, [
    session,
    isLastQuestion,
    currentQuestionIndex,
    hintsUsed,
    questions,
    updateSessionMutation,
    addMessage,
    setCurrentQuestionIndex,
  ])

  // Handle completing the survey
  const handleComplete = useCallback(async () => {
    if (!session) return

    // Update session as completed
    await updateSessionMutation.mutateAsync({
      id: session.id,
      data: {
        status: 'completed',
        completed_at: new Date().toISOString(),
      },
      surveyId: session.survey_id,
    })

    // Navigate to complete page
    navigate(`/ai/${code}/complete`)
  }, [session, updateSessionMutation, navigate, code])

  // Loading state
  if (surveyLoading || (!survey && !surveyData)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Error state
  if (surveyError || storeError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {storeError || '오류가 발생했습니다.'}
          </p>
          <button
            onClick={() => navigate('/ai')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            처음으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  // No session
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            세션 정보가 없습니다. 처음부터 시작해주세요.
          </p>
          <button
            onClick={() => navigate('/ai')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            처음으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const currentSurvey = survey || surveyData

  return (
    <ChatInterface
      survey={currentSurvey!}
      messages={messages}
      streamingContent={streamingContent}
      currentQuestion={currentQuestion}
      currentQuestionIndex={currentQuestionIndex}
      totalQuestions={questions.length}
      isStreaming={isStreaming}
      isLastQuestion={isLastQuestion}
      hintsUsed={currentQuestion ? getHintsUsed(currentQuestion.id) : 0}
      maxHints={currentSurvey?.max_hints_per_question || 3}
      allowHint={currentSurvey?.allow_hint || false}
      onSendMessage={handleSendMessage}
      onOptionSelect={handleOptionSelect}
      onHintRequest={handleHintRequest}
      onNextQuestion={handleNextQuestion}
      onComplete={handleComplete}
      messagesEndRef={messagesEndRef}
    />
  )
}
