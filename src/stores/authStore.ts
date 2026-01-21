// ============================================
// Survey Platform - Auth Store (Zustand)
// ============================================

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { AuthUser } from '@/types'

// --------------------------------------------
// State Interface
// --------------------------------------------

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: AuthUser | null) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

// --------------------------------------------
// Initial State
// --------------------------------------------

const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
}

// --------------------------------------------
// Store
// --------------------------------------------

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setUser: (user) => {
          console.log('[authStore.setUser] called', { user })
          set(
            {
              user,
              isLoading: false,
              isAuthenticated: !!user,
            },
            false,
            'setUser'
          )
        },

        setLoading: (isLoading) => {
          console.log('[authStore.setLoading] called', { isLoading })
          set({ isLoading }, false, 'setLoading')
        },

        reset: () => {
          console.log('[authStore.reset] called')
          set(initialState, false, 'reset')
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'auth-store' }
  )
)

export default useAuthStore
