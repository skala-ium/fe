import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/api'
import type { UserInfo, LoginRequest } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null)
  const isLoggedIn = computed(() => user.value !== null)

  async function login(identifier: string, password: string, role: LoginRequest['role']) {
    await authApi.login({ identifier, password, role })
    await fetchUser()
  }

  async function fetchUser() {
    try {
      const { data } = await authApi.getMe()
      if (data.resultType === 'SUCCESS' && data.data) {
        user.value = data.data
      }
    } catch {
      user.value = null
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      user.value = null
    }
  }

  return { user, isLoggedIn, login, fetchUser, logout }
})
