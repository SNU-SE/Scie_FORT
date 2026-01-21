// ============================================
// Survey Platform - Survey Edit Store (Zustand)
// ============================================

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Survey, Question, Option } from '@/types'

// --------------------------------------------
// State Interface
// --------------------------------------------

interface SurveyEditState {
  // 현재 편집 중인 설문
  survey: Partial<Survey> | null
  questions: Question[]

  // 편집 UI 상태
  selectedQuestionId: string | null
  isQuestionEditorOpen: boolean
  isConditionEditorOpen: boolean
  conditionParentQuestion: Question | null
  conditionParentOptions: Option[]

  // Actions
  setSurvey: (survey: Partial<Survey>) => void
  setQuestions: (questions: Question[]) => void
  addQuestion: (question: Question) => void
  updateQuestion: (id: string, updates: Partial<Question>) => void
  removeQuestion: (id: string) => void
  reorderQuestions: (questions: Question[]) => void

  selectQuestion: (id: string | null) => void
  openQuestionEditor: () => void
  closeQuestionEditor: () => void
  openConditionEditor: (parentQuestion: Question, parentOptions: Option[]) => void
  closeConditionEditor: () => void

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
  isConditionEditorOpen: false,
  conditionParentQuestion: null,
  conditionParentOptions: [],
}

// --------------------------------------------
// Store
// --------------------------------------------

export const useSurveyStore = create<SurveyEditState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Survey Actions
      setSurvey: (survey) => {
        console.log('[surveyStore.setSurvey] called', { survey })
        set(() => {
          console.log('[surveyStore.setSurvey] state updated', { survey })
          return { survey }
        }, false, 'setSurvey')
      },

      setQuestions: (questions) => {
        console.log('[surveyStore.setQuestions] called', { questions })
        set(() => {
          console.log('[surveyStore.setQuestions] state updated', { questions })
          return { questions }
        }, false, 'setQuestions')
      },

      addQuestion: (question) => {
        console.log('[surveyStore.addQuestion] called', { question })
        set(
          (state) => {
            const newQuestions = [...state.questions, question]
            console.log('[surveyStore.addQuestion] state updated', { questions: newQuestions })
            return { questions: newQuestions }
          },
          false,
          'addQuestion'
        )
      },

      updateQuestion: (id, updates) => {
        console.log('[surveyStore.updateQuestion] called', { id, updates })
        set(
          (state) => {
            const newQuestions = state.questions.map((q) =>
              q.id === id ? { ...q, ...updates } : q
            )
            console.log('[surveyStore.updateQuestion] state updated', { questions: newQuestions })
            return { questions: newQuestions }
          },
          false,
          'updateQuestion'
        )
      },

      removeQuestion: (id) => {
        console.log('[surveyStore.removeQuestion] called', { id })
        set(
          (state) => {
            const newQuestions = state.questions.filter((q) => q.id !== id)
            const newSelectedQuestionId = state.selectedQuestionId === id ? null : state.selectedQuestionId
            console.log('[surveyStore.removeQuestion] state updated', { questions: newQuestions, selectedQuestionId: newSelectedQuestionId })
            return {
              questions: newQuestions,
              selectedQuestionId: newSelectedQuestionId,
            }
          },
          false,
          'removeQuestion'
        )
      },

      reorderQuestions: (questions) => {
        console.log('[surveyStore.reorderQuestions] called', { questions })
        set(() => {
          console.log('[surveyStore.reorderQuestions] state updated', { questions })
          return { questions }
        }, false, 'reorderQuestions')
      },

      // UI Actions
      selectQuestion: (id) => {
        console.log('[surveyStore.selectQuestion] called', { id })
        set(() => {
          console.log('[surveyStore.selectQuestion] state updated', { selectedQuestionId: id })
          return { selectedQuestionId: id }
        }, false, 'selectQuestion')
      },

      openQuestionEditor: () => {
        console.log('[surveyStore.openQuestionEditor] called')
        set(() => {
          console.log('[surveyStore.openQuestionEditor] state updated', { isQuestionEditorOpen: true })
          return { isQuestionEditorOpen: true }
        }, false, 'openQuestionEditor')
      },

      closeQuestionEditor: () => {
        console.log('[surveyStore.closeQuestionEditor] called')
        set(
          () => {
            console.log('[surveyStore.closeQuestionEditor] state updated', { isQuestionEditorOpen: false, selectedQuestionId: null })
            return { isQuestionEditorOpen: false, selectedQuestionId: null }
          },
          false,
          'closeQuestionEditor'
        )
      },

      openConditionEditor: (parentQuestion, parentOptions) => {
        console.log('[surveyStore.openConditionEditor] called', { parentQuestion, parentOptions })
        set(
          () => {
            console.log('[surveyStore.openConditionEditor] state updated', {
              isConditionEditorOpen: true,
              conditionParentQuestion: parentQuestion,
              conditionParentOptions: parentOptions,
            })
            return {
              isConditionEditorOpen: true,
              conditionParentQuestion: parentQuestion,
              conditionParentOptions: parentOptions,
            }
          },
          false,
          'openConditionEditor'
        )
      },

      closeConditionEditor: () => {
        console.log('[surveyStore.closeConditionEditor] called')
        set(
          () => {
            console.log('[surveyStore.closeConditionEditor] state updated', {
              isConditionEditorOpen: false,
              conditionParentQuestion: null,
              conditionParentOptions: [],
            })
            return {
              isConditionEditorOpen: false,
              conditionParentQuestion: null,
              conditionParentOptions: [],
            }
          },
          false,
          'closeConditionEditor'
        )
      },

      // Reset
      resetStore: () => {
        console.log('[surveyStore.resetStore] called')
        set(() => {
          console.log('[surveyStore.resetStore] state updated', { ...initialState })
          return initialState
        }, false, 'resetStore')
      },
    }),
    { name: 'survey-store' }
  )
)

// --------------------------------------------
// Selectors
// --------------------------------------------

export const selectSurvey = (state: SurveyEditState) => state.survey
export const selectQuestions = (state: SurveyEditState) => state.questions
export const selectSelectedQuestion = (state: SurveyEditState) => {
  if (!state.selectedQuestionId) return null
  return state.questions.find((q) => q.id === state.selectedQuestionId) || null
}
export const selectIsQuestionEditorOpen = (state: SurveyEditState) => state.isQuestionEditorOpen
export const selectIsConditionEditorOpen = (state: SurveyEditState) => state.isConditionEditorOpen
export const selectConditionParentQuestion = (state: SurveyEditState) => state.conditionParentQuestion
export const selectConditionParentOptions = (state: SurveyEditState) => state.conditionParentOptions

export default useSurveyStore
