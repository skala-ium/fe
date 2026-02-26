import client from './client'
import type { ApiResponse, Page, AssignmentListItem, AssignmentDetailResponse, AssignmentCreateRequest } from '@/types/api'

export const assignmentApi = {
  getAssignments(classId: string, page = 0, size = 20) {
    return client.get<ApiResponse<Page<AssignmentListItem>>>(
      `/api/v1/classes/${classId}/assignments`,
      { params: { page, size } },
    )
  },

  getAssignmentDetail(assignmentId: string) {
    return client.get<ApiResponse<AssignmentDetailResponse>>(
      `/api/v1/assignments/${assignmentId}`,
    )
  },

  createAssignment(request: AssignmentCreateRequest) {
    return client.post<ApiResponse<void>>(
      `/api/v1/assignments`,
      request,
    )
  },
}
