import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RespondentInfo } from '@/types'
import type { ResponseValue } from '@/components/survey'

// ============================================
// Response Store - Zustand State Management
// ============================================

interface ResponseState {
  // State
  sessionId: string | null
  surveyCode: string | null
  respondentInfo: RespondentInfo | null
  currentPage: number
  responses: Record<string, ResponseValue>  // questionId -> response

  // Actions
  setSessionId: (id: string) => void
  setSurveyCode: (code: string) => void
  setRespondentInfo: (info: RespondentInfo) => void
  setCurrentPage: (page: number) => void
  setResponse: (questionId: string, value: ResponseValue) => void
  resetStore: () => void
}

const initialState = {
  sessionId: null,
  surveyCode: null,
  respondentInfo: null,
  currentPage: 0,
  responses: {},
}

export const useResponseStore = create<ResponseState>()(
  persist(
    (set) => ({
      // Initial State
      ...initialState,

      // Actions
      setSessionId: (id: string) => {
        console.log('[responseStore.setSessionId] called', { id })
        set((state) => {
          const newState = { ...state, sessionId: id }
          console.log('[responseStore.setSessionId] state updated', { sessionId: newState.sessionId })
          return { sessionId: id }
        })
      },

      setSurveyCode: (code: string) => {
        console.log('[responseStore.setSurveyCode] called', { code })
        set((state) => {
          const newState = { ...state, surveyCode: code }
          console.log('[responseStore.setSurveyCode] state updated', { surveyCode: newState.surveyCode })
          return { surveyCode: code }
        })
      },

      setRespondentInfo: (info: RespondentInfo) => {
        console.log('[responseStore.setRespondentInfo] called', { info })
        set((state) => {
          const newState = { ...state, respondentInfo: info }
          console.log('[responseStore.setRespondentInfo] state updated', { respondentInfo: newState.respondentInfo })
          return { respondentInfo: info }
        })
      },

      setCurrentPage: (page: number) => {
        console.log('[responseStore.setCurrentPage] called', { page })
        set((state) => {
          const newState = { ...state, currentPage: page }
          console.log('[responseStore.setCurrentPage] state updated', { currentPage: newState.currentPage })
          return { currentPage: page }
        })
      },

      setResponse: (questionId: string, value: ResponseValue) => {
        console.log('[responseStore.setResponse] called', { questionId, value })
        set((state) => {
          const newResponses = { ...state.responses, [questionId]: value }
          console.log('[responseStore.setResponse] state updated', { responses: newResponses })
          return { responses: newResponses }
        })
      },

      resetStore: () => {
        console.log('[responseStore.resetStore] called')
        set(() => {
          console.log('[responseStore.resetStore] state updated', { ...initialState })
          return initialState
        })
      },
    }),
    {
      name: 'survey-response-storage',
      partialize: (state) => ({
        sessionId: state.sessionId,
        surveyCode: state.surveyCode,
        respondentInfo: state.respondentInfo,
        currentPage: state.currentPage,
        responses: state.responses,
      }),
    }
  )
)

export default useResponseStore
