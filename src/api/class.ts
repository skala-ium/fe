import client from './client'
import type { ApiResponse, ClassListItem } from '@/types/api'

export const classApi = {
  getClasses() {
    return client.get<ApiResponse<ClassListItem[]>>('/api/v1/classes')
  },
}
