// ============================================
// Survey Platform - Hooks Barrel Export
// ============================================

// Auth Hook
export { useAuth, default as useAuthDefault } from './useAuth'

// Survey Hooks
export {
  // Query Keys
  surveyKeys,
  // Hooks
  useSurveys,
  useSurveyDetail,
  useSurveyByCode,
  useQuestions,
  useCreateSurvey,
  useUpdateSurvey,
  useDeleteSurvey,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useCreateOption,
  useUpdateOption,
  useDeleteOption,
  useCreateSurveyPage,
  useUpdateSurveyPage,
  useDeleteSurveyPage,
  useCreateAccessCode,
  useUpdateAccessCode,
  useDeleteAccessCode,
} from './useSurvey'

// Response Hooks
export {
  // Query Keys
  responseKeys,
  // Hooks
  useCreateResponseSession,
  useUpdateResponseSession,
  useSaveResponse,
  useSubmitResponses,
  useCompleteResponseSession,
  useResponsesBySurvey,
  useResponseSession,
  useResponseStats,
  useSubmitSurveyResponse,
} from './useResponses'

// Realtime Hooks
export {
  useRealtimeResponses,
  useRealtimeSessions,
  useRealtimeResponseCount,
  useRealtimeCompletedSessions,
  useRealtimeSubscription,
} from './useRealtime'

// AI Hooks
export {
  // Query Keys
  aiKeys,
  // Survey Hooks
  useAISurveys,
  useAISurveyDetail,
  useAISurveyByCode,
  useCreateAISurvey,
  useUpdateAISurvey,
  useDeleteAISurvey,
  // Question Hooks
  useAIQuestions,
  useCreateAIQuestion,
  useUpdateAIQuestion,
  useDeleteAIQuestion,
  // Option Hooks
  useCreateAIOption,
  useUpdateAIOption,
  useDeleteAIOption,
  // Access Code Hooks
  useCreateAIAccessCode,
  useUpdateAIAccessCode,
  useDeleteAIAccessCode,
  // Session Hooks
  useAISessions,
  useAISession,
  useCreateAISession,
  useUpdateAISession,
  // Message Hooks
  useAIMessages,
  useCreateAIMessage,
  // Utility Functions
  saveAIMessage,
  fetchAISurveyByCode,
  getNextMessageIndex,
} from './useAI'
