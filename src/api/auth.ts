import client from './client'
import type { ApiResponse, LoginRequest, UserInfo } from '@/types/api'

export const authApi = {
  login(data: LoginRequest) {
    return client.post<ApiResponse<null>>('/api/v1/auth/login', data)
  },

  logout() {
    return client.post<ApiResponse<null>>('/api/v1/auth/logout')
  },

  refresh() {
    return client.post<ApiResponse<null>>('/api/v1/auth/refresh')
  },

  getMe() {
    return client.get<ApiResponse<UserInfo>>('/api/v1/users/me')
  },
}
