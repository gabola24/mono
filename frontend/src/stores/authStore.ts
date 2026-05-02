import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
    username: string
    isLoggedIn: boolean
    login: (username: string) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            username: '',
            isLoggedIn: false,
            login: (username) => set({ username, isLoggedIn: true }),
            logout: () => set({ username: '', isLoggedIn: false }),
        }),
        { name: 'auth-storage' }
    )
)
