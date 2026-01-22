// ============================================
// AI Survey Platform - Chat Store (Zustand)
// ============================================

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  AISurvey,
  AIQuestion,
  AIAccessCodeRow,
  AIChatSessionRow,
  ChatMessage,
  StudentInfo,
} from '@/types/ai'

// --------------------------------------------
// State Interface
// --------------------------------------------

interface ChatState {
  // 설문 및 세션 정보
  survey: AISurvey | null
  accessCode: AIAccessCodeRow | null
  session: AIChatSessionRow | null
  questions: AIQuestion[]

  // 학생 정보
  studentInfo: StudentInfo | null

  // 채팅 상태
  messages: ChatMessage[]
  currentQuestionIndex: number
  hintsUsed: Record<string, number>  // { questionId: count }
  isStreaming: boolean
  streamingContent: string

  // UI 상태
  isLoading: boolean
  error: string | null

  // Actions - 초기화
  setSurvey: (survey: AISurvey) => void
  setAccessCode: (accessCode: AIAccessCodeRow) => void
  setSession: (session: AIChatSessionRow) => void
  setQuestions: (questions: AIQuestion[]) => void
  setStudentInfo: (info: StudentInfo) => void

  // Actions - 메시지
  addMessage: (message: ChatMessage) => void
  updateLastMessage: (content: string) => void
  setMessages: (messages: ChatMessage[]) => void

  // Actions - 문제 진행
  nextQuestion: () => void
  setCurrentQuestionIndex: (index: number) => void

  // Actions - 힌트
  incrementHintUsed: (questionId: string) => void
  getHintsUsed: (questionId: string) => number

  // Actions - 스트리밍
  setIsStreaming: (isStreaming: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void

  // Actions - UI
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void

  // Actions - 리셋
  resetChat: () => void
  resetStore: () => void
}

// --------------------------------------------
// Helper Functions
// --------------------------------------------

function generateQuestionIntroMessages(
  question: AIQuestion,
  index: number
): ChatMessage[] {
  const messages: ChatMessage[] = []
  const timestamp = new Date().toISOString()

  // 문제 번호 안내
  messages.push({
    id: `intro-${question.id}-${Date.now()}`,
    role: 'assistant',
    content: `${index + 1}번 문제야!`,
    content_type: 'text',
    message_type: 'system',
    created_at: timestamp,
  })

  // 이미지가 있으면 이미지 메시지
  if (question.question_image_url) {
    messages.push({
      id: `image-${question.id}-${Date.now()}`,
      role: 'assistant',
      content: '',
      content_type: 'image',
      image_url: question.question_image_url,
      message_type: 'system',
      created_at: timestamp,
    })
  }

  // 문제 텍스트
  messages.push({
    id: `text-${question.id}-${Date.now()}`,
    role: 'assistant',
    content: question.question_text,
    content_type: 'text',
    message_type: 'system',
    created_at: timestamp,
  })

  // 객관식이면 선택지 메시지
  if (question.question_type !== 'text' && question.options.length > 0) {
    messages.push({
      id: `options-${question.id}-${Date.now()}`,
      role: 'assistant',
      content: '아래에서 답을 선택해줘:',
      content_type: 'options',
      options: question.options,
      message_type: 'system',
      created_at: timestamp,
    })
  }

  return messages
}

// --------------------------------------------
// Initial State
// --------------------------------------------

const initialState = {
  survey: null,
  accessCode: null,
  session: null,
  questions: [],
  studentInfo: null,
  messages: [],
  currentQuestionIndex: 0,
  hintsUsed: {},
  isStreaming: false,
  streamingContent: '',
  isLoading: false,
  error: null,
}

// --------------------------------------------
// Store
// --------------------------------------------

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 초기화 Actions
      setSurvey: (survey) => {
        set(() => ({ survey }), false, 'setSurvey')
      },

      setAccessCode: (accessCode) => {
        set(() => ({ accessCode }), false, 'setAccessCode')
      },

      setSession: (session) => {
        set(() => ({
          session,
          currentQuestionIndex: session.current_question_index,
          hintsUsed: session.hints_used || {},
        }), false, 'setSession')
      },

      setQuestions: (questions) => {
        set(() => ({ questions }), false, 'setQuestions')
      },

      setStudentInfo: (info) => {
        set(() => ({ studentInfo: info }), false, 'setStudentInfo')
      },

      // 메시지 Actions
      addMessage: (message) => {
        set(
          (state) => ({ messages: [...state.messages, message] }),
          false,
          'addMessage'
        )
      },

      updateLastMessage: (content) => {
        set(
          (state) => {
            const messages = [...state.messages]
            if (messages.length > 0) {
              messages[messages.length - 1] = {
                ...messages[messages.length - 1],
                content,
                isStreaming: false,
              }
            }
            return { messages }
          },
          false,
          'updateLastMessage'
        )
      },

      setMessages: (messages) => {
        set(() => ({ messages }), false, 'setMessages')
      },

      // 문제 진행 Actions
      nextQuestion: () => {
        const state = get()
        const nextIndex = state.currentQuestionIndex + 1

        if (nextIndex < state.questions.length) {
          const nextQuestion = state.questions[nextIndex]
          const introMessages = generateQuestionIntroMessages(nextQuestion, nextIndex)

          set(
            (state) => ({
              currentQuestionIndex: nextIndex,
              messages: [...state.messages, ...introMessages],
            }),
            false,
            'nextQuestion'
          )
        }
      },

      setCurrentQuestionIndex: (index) => {
        const state = get()
        if (index >= 0 && index < state.questions.length) {
          const question = state.questions[index]
          const introMessages = generateQuestionIntroMessages(question, index)

          set(
            () => ({
              currentQuestionIndex: index,
              messages: introMessages,
            }),
            false,
            'setCurrentQuestionIndex'
          )
        }
      },

      // 힌트 Actions
      incrementHintUsed: (questionId) => {
        set(
          (state) => ({
            hintsUsed: {
              ...state.hintsUsed,
              [questionId]: (state.hintsUsed[questionId] || 0) + 1,
            },
          }),
          false,
          'incrementHintUsed'
        )
      },

      getHintsUsed: (questionId) => {
        return get().hintsUsed[questionId] || 0
      },

      // 스트리밍 Actions
      setIsStreaming: (isStreaming) => {
        set(() => ({ isStreaming }), false, 'setIsStreaming')
      },

      setStreamingContent: (content) => {
        set(() => ({ streamingContent: content }), false, 'setStreamingContent')
      },

      appendStreamingContent: (chunk) => {
        set(
          (state) => ({ streamingContent: state.streamingContent + chunk }),
          false,
          'appendStreamingContent'
        )
      },

      // UI Actions
      setIsLoading: (isLoading) => {
        set(() => ({ isLoading }), false, 'setIsLoading')
      },

      setError: (error) => {
        set(() => ({ error }), false, 'setError')
      },

      // 리셋 Actions
      resetChat: () => {
        set(
          () => ({
            messages: [],
            currentQuestionIndex: 0,
            hintsUsed: {},
            isStreaming: false,
            streamingContent: '',
            error: null,
          }),
          false,
          'resetChat'
        )
      },

      resetStore: () => {
        set(() => initialState, false, 'resetStore')
      },
    }),
    { name: 'chat-store' }
  )
)

// --------------------------------------------
// Selectors
// --------------------------------------------

export const selectSurvey = (state: ChatState) => state.survey
export const selectSession = (state: ChatState) => state.session
export const selectQuestions = (state: ChatState) => state.questions
export const selectMessages = (state: ChatState) => state.messages
export const selectCurrentQuestion = (state: ChatState) => {
  if (state.currentQuestionIndex >= state.questions.length) return null
  return state.questions[state.currentQuestionIndex]
}
export const selectCurrentQuestionIndex = (state: ChatState) => state.currentQuestionIndex
export const selectTotalQuestions = (state: ChatState) => state.questions.length
export const selectIsLastQuestion = (state: ChatState) =>
  state.currentQuestionIndex >= state.questions.length - 1
export const selectIsStreaming = (state: ChatState) => state.isStreaming
export const selectIsLoading = (state: ChatState) => state.isLoading
export const selectError = (state: ChatState) => state.error

// Helper export
export { generateQuestionIntroMessages }

export default useChatStore
