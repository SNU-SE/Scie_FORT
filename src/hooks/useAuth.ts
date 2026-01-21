import { useEffect, useCallback } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { AuthUser } from '@/types'

/**
 * Supabase Auth 연동 Hook
 * - login, logout, getCurrentUser
 * - 인증 상태 관리 (Zustand 전역 상태 사용)
 */
export function useAuth() {
  console.log('[useAuth] hook initialized')

  const { user, isLoading, isAuthenticated, setUser, setLoading } = useAuthStore()

  /**
   * Supabase User를 AuthUser로 변환
   */
  const toAuthUser = (user: User | null): AuthUser | null => {
    console.log('[useAuth.toAuthUser] called', { user })
    if (!user) return null
    return {
      id: user.id,
      email: user.email ?? '',
      created_at: user.created_at,
    }
  }

  /**
   * 현재 사용자 정보 조회
   */
  const getCurrentUser = useCallback(async (): Promise<AuthUser | null> => {
    console.log('[useAuth.getCurrentUser] called')
    try {
      console.log('[useAuth.getCurrentUser] API request')
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('[useAuth.getCurrentUser] API response', { user, error })
      if (error) {
        console.error('[useAuth.getCurrentUser] error', error)
        throw error
      }
      return toAuthUser(user)
    } catch (error) {
      console.error('[useAuth.getCurrentUser] catch error', error)
      return null
    }
  }, [])

  /**
   * 이메일/비밀번호 로그인
   */
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
    console.log('[useAuth.login] called', { email })
    try {
      setLoading(true)

      console.log('[useAuth.login] API request', { email })
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      console.log('[useAuth.login] API response', { data, error })

      if (error) {
        console.error('[useAuth.login] error', error)
        setLoading(false)
        return { user: null, error }
      }

      const authUser = toAuthUser(data.user)
      setUser(authUser)

      console.log('[useAuth.login] success', { authUser })
      return { user: authUser, error: null }
    } catch (error) {
      console.error('[useAuth.login] catch error', error)
      setLoading(false)
      return { user: null, error: error as AuthError }
    }
  }, [setUser, setLoading])

  /**
   * 로그아웃
   */
  const logout = useCallback(async (): Promise<{ error: AuthError | null }> => {
    console.log('[useAuth.logout] called')
    try {
      setLoading(true)

      console.log('[useAuth.logout] API request')
      const { error } = await supabase.auth.signOut()
      console.log('[useAuth.logout] API response', { error })

      if (error) {
        console.error('[useAuth.logout] error', error)
        setLoading(false)
        return { error }
      }

      setUser(null)

      console.log('[useAuth.logout] success')
      return { error: null }
    } catch (error) {
      console.error('[useAuth.logout] catch error', error)
      setLoading(false)
      return { error: error as AuthError }
    }
  }, [setUser, setLoading])

  /**
   * 회원가입
   */
  const signUp = useCallback(async (
    email: string,
    password: string
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
    console.log('[useAuth.signUp] called', { email })
    try {
      setLoading(true)

      console.log('[useAuth.signUp] API request', { email })
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      console.log('[useAuth.signUp] API response', { data, error })

      if (error) {
        console.error('[useAuth.signUp] error', error)
        setLoading(false)
        return { user: null, error }
      }

      const authUser = toAuthUser(data.user)
      setUser(authUser)

      console.log('[useAuth.signUp] success', { authUser })
      return { user: authUser, error: null }
    } catch (error) {
      console.error('[useAuth.signUp] catch error', error)
      setLoading(false)
      return { user: null, error: error as AuthError }
    }
  }, [setUser, setLoading])

  /**
   * 비밀번호 재설정 이메일 발송
   */
  const resetPassword = useCallback(async (
    email: string
  ): Promise<{ error: AuthError | null }> => {
    console.log('[useAuth.resetPassword] called', { email })
    try {
      console.log('[useAuth.resetPassword] API request', { email })
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      console.log('[useAuth.resetPassword] API response', { error })
      if (error) {
        console.error('[useAuth.resetPassword] error', error)
      }
      return { error }
    } catch (error) {
      console.error('[useAuth.resetPassword] catch error', error)
      return { error: error as AuthError }
    }
  }, [])

  /**
   * 비밀번호 업데이트
   */
  const updatePassword = useCallback(async (
    newPassword: string
  ): Promise<{ error: AuthError | null }> => {
    console.log('[useAuth.updatePassword] called')
    try {
      console.log('[useAuth.updatePassword] API request')
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      console.log('[useAuth.updatePassword] API response', { error })
      if (error) {
        console.error('[useAuth.updatePassword] error', error)
      }
      return { error }
    } catch (error) {
      console.error('[useAuth.updatePassword] catch error', error)
      return { error: error as AuthError }
    }
  }, [])

  /**
   * 세션 새로고침
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    console.log('[useAuth.refreshSession] called')
    try {
      console.log('[useAuth.refreshSession] API request')
      const { data: { session }, error } = await supabase.auth.refreshSession()
      console.log('[useAuth.refreshSession] API response', { session, error })
      if (error) {
        console.error('[useAuth.refreshSession] error', error)
        throw error
      }

      const authUser = toAuthUser(session?.user ?? null)
      setUser(authUser)
      console.log('[useAuth.refreshSession] success', { authUser })
    } catch (error) {
      console.error('[useAuth.refreshSession] catch error', error)
      setUser(null)
    }
  }, [setUser])

  // 초기 세션 로드 및 인증 상태 변경 구독
  useEffect(() => {
    // 초기 세션 확인
    const initializeAuth = async () => {
      console.log('[useAuth.initializeAuth] called')
      try {
        console.log('[useAuth.initializeAuth] API request')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[useAuth.initializeAuth] API response', { session })
        const authUser = toAuthUser(session?.user ?? null)
        setUser(authUser)
        console.log('[useAuth.initializeAuth] success', { authUser })
      } catch (error) {
        console.error('[useAuth.initializeAuth] catch error', error)
        setUser(null)
      }
    }

    initializeAuth()

    // 인증 상태 변경 구독
    console.log('[useAuth] subscribing to auth state changes')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth.onAuthStateChange] event', { event, session })
        const authUser = toAuthUser(session?.user ?? null)
        setUser(authUser)
      }
    )

    return () => {
      console.log('[useAuth] unsubscribing from auth state changes')
      subscription.unsubscribe()
    }
  }, [setUser])

  return {
    // State (from Zustand store)
    user,
    isLoading,
    isAuthenticated,

    // Actions
    login,
    logout,
    signUp,
    getCurrentUser,
    resetPassword,
    updatePassword,
    refreshSession,
  }
}

export default useAuth
