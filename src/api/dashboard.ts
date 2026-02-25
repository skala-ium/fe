import client from './client'
import type { ApiResponse, DashboardResponse } from '@/types/api'

export const dashboardApi = {
  getDashboard() {
    return client.get<ApiResponse<DashboardResponse>>('/api/v1/dashboard')
  },
}
