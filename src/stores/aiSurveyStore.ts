// ============================================
// AI Survey Platform - AI Survey Edit Store (Zustand)
// ============================================

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AISurvey, AIQuestion, AIOption } from '@/types/ai'

// --------------------------------------------
// State Interface
// --------------------------------------------

interface AISurveyEditState {
  // 현재 편집 중인 설문
  survey: Partial<AISurvey> | null
  questions: AIQuestion[]

  // 편집 UI 상태
  selectedQuestionId: string | null
  isQuestionEditorOpen: boolean

  // Actions
  setSurvey: (survey: Partial<AISurvey>) => void
  setQuestions: (questions: AIQuestion[]) => void
  addQuestion: (question: AIQuestion) => void
  updateQuestion: (id: string, updates: Partial<AIQuestion>) => void
  removeQuestion: (id: string) => void
  reorderQuestions: (questions: AIQuestion[]) => void

  // Option Actions
  addOption: (questionId: string, option: AIOption) => void
  updateOption: (questionId: string, optionId: string, updates: Partial<AIOption>) => void
  removeOption: (questionId: string, optionId: string) => void

  // UI Actions
  selectQuestion: (id: string | null) => void
  openQuestionEditor: () => void
  closeQuestionEditor: () => void

  resetStore: () => void
}

// --------------------------------------------
// Initial State
// --------------------------------------------

const initialState = {
  survey: null,
  questions: [],
  selectedQuestionId: null,
  isQuestionEditorOpen: false,
}

// --------------------------------------------
// Store
// --------------------------------------------

export const useAISurveyStore = create<AISurveyEditState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Survey Actions
      setSurvey: (survey) => {
        set(() => ({ survey }), false, 'setSurvey')
      },

      setQuestions: (questions) => {
        set(() => ({ questions }), false, 'setQuestions')
      },

      addQuestion: (question) => {
        set(
          (state) => {
            const insertIndex = question.order_index
            const newQuestions = [...state.questions]

            // 삽입 위치 이후의 질문들의 order_index 증가
            newQuestions.forEach((q) => {
              if (q.order_index >= insertIndex) {
                q.order_index += 1
              }
            })

            // 새 질문 삽입
            newQuestions.push(question)

            // order_index로 정렬
            newQuestions.sort((a, b) => a.order_index - b.order_index)

            return { questions: newQuestions }
          },
          false,
          'addQuestion'
        )
      },

      updateQuestion: (id, updates) => {
        set(
          (state) => ({
            questions: state.questions.map((q) =>
              q.id === id ? { ...q, ...updates } : q
            ),
          }),
          false,
          'updateQuestion'
        )
      },

      removeQuestion: (id) => {
        set(
          (state) => ({
            questions: state.questions.filter((q) => q.id !== id),
            selectedQuestionId: state.selectedQuestionId === id ? null : state.selectedQuestionId,
          }),
          false,
          'removeQuestion'
        )
      },

      reorderQuestions: (questions) => {
        set(() => ({ questions }), false, 'reorderQuestions')
      },

      // Option Actions
      addOption: (questionId, option) => {
        set(
          (state) => ({
            questions: state.questions.map((q) =>
              q.id === questionId
                ? { ...q, options: [...q.options, option] }
                : q
            ),
          }),
          false,
          'addOption'
        )
      },

      updateOption: (questionId, optionId, updates) => {
        set(
          (state) => ({
            questions: state.questions.map((q) =>
              q.id === questionId
                ? {
                    ...q,
                    options: q.options.map((o) =>
                      o.id === optionId ? { ...o, ...updates } : o
                    ),
                  }
                : q
            ),
          }),
          false,
          'updateOption'
        )
      },

      removeOption: (questionId, optionId) => {
        set(
          (state) => ({
            questions: state.questions.map((q) =>
              q.id === questionId
                ? { ...q, options: q.options.filter((o) => o.id !== optionId) }
                : q
            ),
          }),
          false,
          'removeOption'
        )
      },

      // UI Actions
      selectQuestion: (id) => {
        set(() => ({ selectedQuestionId: id }), false, 'selectQuestion')
      },

      openQuestionEditor: () => {
        set(() => ({ isQuestionEditorOpen: true }), false, 'openQuestionEditor')
      },

      closeQuestionEditor: () => {
        set(
          () => ({ isQuestionEditorOpen: false, selectedQuestionId: null }),
          false,
          'closeQuestionEditor'
        )
      },

      // Reset
      resetStore: () => {
        set(() => initialState, false, 'resetStore')
      },
    }),
    { name: 'ai-survey-store' }
  )
)

// --------------------------------------------
// Selectors
// --------------------------------------------

export const selectAISurvey = (state: AISurveyEditState) => state.survey
export const selectAIQuestions = (state: AISurveyEditState) => state.questions
export const selectSelectedAIQuestion = (state: AISurveyEditState) => {
  if (!state.selectedQuestionId) return null
  return state.questions.find((q) => q.id === state.selectedQuestionId) || null
}
export const selectIsAIQuestionEditorOpen = (state: AISurveyEditState) => state.isQuestionEditorOpen

export default useAISurveyStore
