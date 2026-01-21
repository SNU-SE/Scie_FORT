import { useEffect, useCallback, useRef, useState } from 'react'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type {
  ResponseSessionRow,
  ResponseRow,
  RealtimeEvent,
} from '@/types'

// ============================================
// Types
// ============================================

interface UseRealtimeOptions {
  enabled?: boolean
}

interface RealtimeResponsePayload {
  eventType: RealtimeEvent
  new: ResponseRow
  old: ResponseRow | null
}

interface RealtimeSessionPayload {
  eventType: RealtimeEvent
  new: ResponseSessionRow
  old: ResponseSessionRow | null
}

// ============================================
// Realtime Hooks
// ============================================

/**
 * 설문별 새 응답 실시간 감지 Hook
 */
export function useRealtimeResponses(
  surveyId: string | undefined,
  onNewResponse?: (payload: RealtimeResponsePayload) => void,
  options: UseRealtimeOptions = {}
) {
  console.log('[useRealtimeResponses] hook called', { surveyId, options })
  const { enabled = true } = options
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // 콜백을 ref로 저장하여 의존성에서 제거
  const onNewResponseRef = useRef(onNewResponse)
  onNewResponseRef.current = onNewResponse

  useEffect(() => {
    if (!surveyId || !enabled) {
      console.log('[useRealtimeResponses] skipping subscription', { surveyId, enabled })
      return
    }

    const channelName = `responses:survey:${surveyId}`
    console.log('[useRealtimeResponses] setting up subscription', { channelName })

    // 기존 채널이 있으면 정리
    if (channelRef.current) {
      console.log('[useRealtimeResponses] removing existing channel')
      supabase.removeChannel(channelRef.current)
    }

    // 핸들러 함수
    const handleChange = (payload: RealtimePostgresChangesPayload<ResponseRow>) => {
      console.log('[useRealtimeResponses.handleChange] received', { eventType: payload.eventType, payload })
      const realtimePayload: RealtimeResponsePayload = {
        eventType: payload.eventType as RealtimeEvent,
        new: payload.new as ResponseRow,
        old: (payload.old as ResponseRow) || null,
      }
      onNewResponseRef.current?.(realtimePayload)
    }

    // 새 채널 생성 및 구독
    console.log('[useRealtimeResponses] creating new channel')
    const channel = supabase
      .channel(channelName)
      .on<ResponseRow>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'responses',
          // 참고: filter는 response_sessions를 통해 survey_id를 필터링해야 하지만
          // Supabase Realtime의 한계로 인해 클라이언트에서 필터링 필요
        },
        handleChange
      )
      .subscribe((status) => {
        console.log('[useRealtimeResponses] subscription status', { status })
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true)
          setError(null)
          console.log('[useRealtimeResponses] successfully subscribed')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useRealtimeResponses] channel error')
          setError(new Error('Failed to subscribe to realtime channel'))
          setIsSubscribed(false)
        } else if (status === 'TIMED_OUT') {
          console.error('[useRealtimeResponses] subscription timed out')
          setError(new Error('Realtime subscription timed out'))
          setIsSubscribed(false)
        }
      })

    channelRef.current = channel

    return () => {
      console.log('[useRealtimeResponses] cleanup - removing channel')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        setIsSubscribed(false)
      }
    }
  }, [surveyId, enabled])

  const unsubscribe = useCallback(() => {
    console.log('[useRealtimeResponses.unsubscribe] called')
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      setIsSubscribed(false)
    }
  }, [])

  return {
    isSubscribed,
    error,
    unsubscribe,
  }
}

/**
 * 설문별 응답 세션 실시간 감지 Hook
 */
export function useRealtimeSessions(
  surveyId: string | undefined,
  onSessionChange?: (payload: RealtimeSessionPayload) => void,
  options: UseRealtimeOptions = {}
) {
  console.log('[useRealtimeSessions] hook called', { surveyId, options })
  const { enabled = true } = options
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // 콜백을 ref로 저장하여 의존성에서 제거
  const onSessionChangeRef = useRef(onSessionChange)
  onSessionChangeRef.current = onSessionChange

  useEffect(() => {
    if (!surveyId || !enabled) {
      console.log('[useRealtimeSessions] skipping subscription', { surveyId, enabled })
      return
    }

    const channelName = `sessions:survey:${surveyId}`
    console.log('[useRealtimeSessions] setting up subscription', { channelName })

    if (channelRef.current) {
      console.log('[useRealtimeSessions] removing existing channel')
      supabase.removeChannel(channelRef.current)
    }

    // 핸들러 함수
    const handleChange = (payload: RealtimePostgresChangesPayload<ResponseSessionRow>) => {
      console.log('[useRealtimeSessions.handleChange] received', { eventType: payload.eventType, payload })
      // survey_id 필터링
      const newSession = payload.new as ResponseSessionRow
      if (newSession && newSession.survey_id !== surveyId) {
        console.log('[useRealtimeSessions.handleChange] filtered out - different survey_id', { newSession_surveyId: newSession.survey_id, surveyId })
        return
      }

      const realtimePayload: RealtimeSessionPayload = {
        eventType: payload.eventType as RealtimeEvent,
        new: newSession,
        old: (payload.old as ResponseSessionRow) || null,
      }
      onSessionChangeRef.current?.(realtimePayload)
    }

    console.log('[useRealtimeSessions] creating new channel')
    const channel = supabase
      .channel(channelName)
      .on<ResponseSessionRow>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'response_sessions',
          filter: `survey_id=eq.${surveyId}`,
        },
        handleChange
      )
      .subscribe((status) => {
        console.log('[useRealtimeSessions] subscription status', { status })
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true)
          setError(null)
          console.log('[useRealtimeSessions] successfully subscribed')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useRealtimeSessions] channel error')
          setError(new Error('Failed to subscribe to realtime channel'))
          setIsSubscribed(false)
        } else if (status === 'TIMED_OUT') {
          console.error('[useRealtimeSessions] subscription timed out')
          setError(new Error('Realtime subscription timed out'))
          setIsSubscribed(false)
        }
      })

    channelRef.current = channel

    return () => {
      console.log('[useRealtimeSessions] cleanup - removing channel')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        setIsSubscribed(false)
      }
    }
  }, [surveyId, enabled])

  const unsubscribe = useCallback(() => {
    console.log('[useRealtimeSessions.unsubscribe] called')
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      setIsSubscribed(false)
    }
  }, [])

  return {
    isSubscribed,
    error,
    unsubscribe,
  }
}

/**
 * 새 응답 실시간 카운터 Hook
 * 설문의 새 응답 수를 실시간으로 추적
 */
export function useRealtimeResponseCount(
  surveyId: string | undefined,
  initialCount: number = 0,
  options: UseRealtimeOptions = {}
) {
  console.log('[useRealtimeResponseCount] hook called', { surveyId, initialCount, options })
  const [count, setCount] = useState(initialCount)
  const [newResponsesCount, setNewResponsesCount] = useState(0)

  const handleNewSession = useCallback((payload: RealtimeSessionPayload) => {
    console.log('[useRealtimeResponseCount.handleNewSession] received', { eventType: payload.eventType })
    if (payload.eventType === 'INSERT') {
      console.log('[useRealtimeResponseCount.handleNewSession] incrementing count')
      setCount((prev) => prev + 1)
      setNewResponsesCount((prev) => prev + 1)
    }
  }, [])

  const { isSubscribed, error } = useRealtimeSessions(
    surveyId,
    handleNewSession,
    options
  )

  const resetNewCount = useCallback(() => {
    console.log('[useRealtimeResponseCount.resetNewCount] called')
    setNewResponsesCount(0)
  }, [])

  // 초기 카운트 동기화
  useEffect(() => {
    console.log('[useRealtimeResponseCount] syncing initial count', { initialCount })
    setCount(initialCount)
  }, [initialCount])

  return {
    count,
    newResponsesCount,
    resetNewCount,
    isSubscribed,
    error,
  }
}

/**
 * 완료된 응답 실시간 감지 Hook
 */
export function useRealtimeCompletedSessions(
  surveyId: string | undefined,
  onCompleted?: (session: ResponseSessionRow) => void,
  options: UseRealtimeOptions = {}
) {
  console.log('[useRealtimeCompletedSessions] hook called', { surveyId, options })

  const handleSessionChange = useCallback(
    (payload: RealtimeSessionPayload) => {
      console.log('[useRealtimeCompletedSessions.handleSessionChange] received', { eventType: payload.eventType })
      // UPDATE 이벤트이고 completed_at이 새로 설정된 경우
      if (
        payload.eventType === 'UPDATE' &&
        payload.new.completed_at &&
        !payload.old?.completed_at
      ) {
        console.log('[useRealtimeCompletedSessions.handleSessionChange] session completed', { session: payload.new })
        onCompleted?.(payload.new)
      }
    },
    [onCompleted]
  )

  return useRealtimeSessions(surveyId, handleSessionChange, options)
}

/**
 * 범용 테이블 Realtime 구독 Hook
 */
export function useRealtimeSubscription<T extends Record<string, unknown>>(
  table: string,
  filter?: string,
  onInsert?: (record: T) => void,
  onUpdate?: (record: T, oldRecord: T | null) => void,
  onDelete?: (oldRecord: T) => void,
  options: UseRealtimeOptions = {}
) {
  console.log('[useRealtimeSubscription] hook called', { table, filter, options })
  const { enabled = true } = options
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled) {
      console.log('[useRealtimeSubscription] skipping subscription - not enabled')
      return
    }

    const channelName = `${table}:${filter || 'all'}:${Date.now()}`
    console.log('[useRealtimeSubscription] setting up subscription', { channelName, table, filter })

    if (channelRef.current) {
      console.log('[useRealtimeSubscription] removing existing channel')
      supabase.removeChannel(channelRef.current)
    }

    const channelConfig: {
      event: '*'
      schema: 'public'
      table: string
      filter?: string
    } = {
      event: '*',
      schema: 'public',
      table,
    }

    if (filter) {
      channelConfig.filter = filter
    }

    console.log('[useRealtimeSubscription] creating new channel', { channelConfig })
    const channel = supabase
      .channel(channelName)
      .on<T>(
        'postgres_changes',
        channelConfig,
        (payload: RealtimePostgresChangesPayload<T>) => {
          console.log('[useRealtimeSubscription] received event', { eventType: payload.eventType, payload })
          switch (payload.eventType) {
            case 'INSERT':
              console.log('[useRealtimeSubscription] INSERT event')
              onInsert?.(payload.new as T)
              break
            case 'UPDATE':
              console.log('[useRealtimeSubscription] UPDATE event')
              onUpdate?.(payload.new as T, (payload.old as T) || null)
              break
            case 'DELETE':
              console.log('[useRealtimeSubscription] DELETE event')
              onDelete?.(payload.old as T)
              break
          }
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeSubscription] subscription status', { status })
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true)
          setError(null)
          console.log('[useRealtimeSubscription] successfully subscribed')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useRealtimeSubscription] channel error')
          setError(new Error('Failed to subscribe to realtime channel'))
          setIsSubscribed(false)
        }
      })

    channelRef.current = channel

    return () => {
      console.log('[useRealtimeSubscription] cleanup - removing channel')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        setIsSubscribed(false)
      }
    }
  }, [table, filter, enabled, onInsert, onUpdate, onDelete])

  const unsubscribe = useCallback(() => {
    console.log('[useRealtimeSubscription.unsubscribe] called')
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      setIsSubscribed(false)
    }
  }, [])

  return {
    isSubscribed,
    error,
    unsubscribe,
  }
}

export default {
  useRealtimeResponses,
  useRealtimeSessions,
  useRealtimeResponseCount,
  useRealtimeCompletedSessions,
  useRealtimeSubscription,
}
