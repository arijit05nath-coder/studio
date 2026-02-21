
"use client"

import { create } from 'zustand'

export type UserRole = 'student' | 'teacher'

interface User {
  id: string
  email: string
  role: UserRole
  name: string
}

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
